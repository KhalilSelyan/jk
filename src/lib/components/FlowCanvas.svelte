<script lang="ts">
	import { Background, Controls, SvelteFlow, type DefaultEdgeOptions } from "@xyflow/svelte";
	import "@xyflow/svelte/dist/style.css";
	import { mode } from "mode-watcher";
	import {
		addEdge,
		addNode,
		edges,
		nodes,
		deleteNode,
		deleteEdge,
	} from "../stores/flowStore.svelte";
	import { systemLock } from "../stores/lockStore.svelte";
	import type { FlowNode, NodeType } from "../types";
	import CreateNodeDialog from "./CreateNodeDialog.svelte";
	import FloatingDock from "./FloatingDock.svelte";
	import ActionNode from "./nodes/ActionNode.svelte";
	import TaskNode from "./nodes/TaskNode.svelte";
	import TriggerNode from "./nodes/TriggerNode.svelte";

	const nodeTypes = {
		workflowStart: TriggerNode,
		verifiableTask: TaskNode,
		systemControl: ActionNode,
	};

	let showDialog = $state(false);
	let selectedNodeType: NodeType | undefined = $state();

	function handleOpenDialog({ type }: { type: NodeType }) {
		selectedNodeType = type;
		showDialog = true;
	}

	function handleCreateNode(node: FlowNode) {
		addNode(node);
		showDialog = false;
	}

	function handleConnect(event: CustomEvent<any>) {
		const { source, target } = event.detail;
		if (source && target) {
			addEdge({
				id: `${source}-${target}`,
				source,
				target,
			});
		}
	}

	// Add defaultEdgeOptions to reduce edge recalculations

	const defaultEdgeOptions: DefaultEdgeOptions = {
		type: "customEdgeType",
		animated: false,
		interactionWidth: 10,
		hidden: false,
		deletable: true,
		selectable: false,
		zIndex: 12,
	};
</script>

<div class="relative h-[90dvh] w-full rounded-lg shadow-md">
	{#if $systemLock.isLocked}
		<div
			class="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-md border border-red-500 bg-red-500/10 px-4 py-2 text-red-500"
		>
			{$systemLock.reason}
		</div>
	{/if}

	<SvelteFlow
		{nodes}
		{edges}
		{nodeTypes}
		{defaultEdgeOptions}
		fitView
		snapToGrid
		snapGrid={[15, 15]}
		elevateNodesOnSelect={false}
		colorMode={$mode}
		on:connect={handleConnect}
		ondelete={async ({ nodes, edges }) => {
			for (const edge of edges) {
				await deleteEdge(edge.id);
			}
			for (const node of nodes) {
				await deleteNode(node.id);
			}
		}}
	>
		<Background bgColor={$mode === "dark" ? "#020817" : ""} gap={15} />
		<Controls />
		<FloatingDock openDialog={handleOpenDialog} />
	</SvelteFlow>
</div>

{#if selectedNodeType}
	<CreateNodeDialog
		bind:show={showDialog}
		type={selectedNodeType}
		close={() => (showDialog = false)}
		create={handleCreateNode}
	/>
{/if}
