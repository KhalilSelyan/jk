<script lang="ts">
	import { workflowStore } from "@/stores/workflowStore.svelte";
	import { Background, Controls, SvelteFlow, type DefaultEdgeOptions } from "@xyflow/svelte";
	import "@xyflow/svelte/dist/style.css";
	import { mode } from "mode-watcher";
	import { onMount } from "svelte";
	import { ulid } from "ulid";
	import { nodes, edges } from "../stores/flowStore.svelte";
	import { systemLock } from "../stores/lockStore.svelte";
	import type { FlowNode, NodeType } from "../types";
	import CreateNodeDialog from "./CreateNodeDialog.svelte";
	import FloatingDock from "./FloatingDock.svelte";
	import ActionNode from "./nodes/ActionNode.svelte";
	import TaskNode from "./nodes/TaskNode.svelte";
	import TriggerNode from "./nodes/TriggerNode.svelte";
	import WorkflowManager from "./WorkflowManager.svelte";

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
		workflowStore.addNode(node);
		showDialog = false;
	}

	function handleNodeDragStop(event: CustomEvent<any>) {
		const { id, position } = event.detail.targetNode;
		workflowStore.updateNodePosition(id, position);
	}

	const defaultEdgeOptions: DefaultEdgeOptions = {
		type: "customEdgeType",
		animated: false,
		interactionWidth: 10,
		hidden: false,
		deletable: true,
		selectable: false,
		zIndex: 12,
	};

	// Get current day index (0-6, Monday-Sunday)
	function getCurrentDayIndex() {
		const today = new Date().getDay();
		return today === 0 ? 6 : today - 1;
	}

	onMount(async () => {
		const currentDay = getCurrentDayIndex();
		const workflow = await workflowStore.getWorkflowForDay(currentDay);
		if (workflow) {
			await workflowStore.loadWorkflow(workflow.id);
		}
	});
</script>

<div class="relative h-[90dvh] w-full rounded-lg shadow-md">
	<div class="absolute left-4 right-4 top-4 z-50">
		<WorkflowManager />
	</div>

	{#if $systemLock.isLocked}
		<div
			class="absolute left-1/2 top-20 z-50 -translate-x-1/2 rounded-md border border-red-500 bg-red-500/10 px-4 py-2 text-red-500"
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
		elevateNodesOnSelect={false}
		colorMode={$mode}
		on:nodedragstop={handleNodeDragStop}
		onconnect={async (e) => {
			await workflowStore.addEdge({ source: e.source, target: e.target, id: ulid() });
		}}
		ondelete={async ({ nodes: deletedNodes, edges: deletedEdges }) => {
			for (const edge of deletedEdges) {
				await workflowStore.deleteEdge(edge.id);
			}
			for (const node of deletedNodes) {
				await workflowStore.deleteNode(node.id);
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
