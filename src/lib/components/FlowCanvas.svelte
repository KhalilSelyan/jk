<script lang="ts">
	import { workflowStore } from "@/stores/workflowStore.svelte";
	import {
		Background,
		Controls,
		SvelteFlow,
		type DefaultEdgeOptions,
		type NodeProps,
		type NodeTypes,
	} from "@xyflow/svelte";
	import "@xyflow/svelte/dist/style.css";
	import { mode } from "mode-watcher";
	import { onMount, type SvelteComponent, type ComponentType } from "svelte";
	import { ulid } from "ulid";
	import { edges, nodes } from "../stores/flowStore.svelte";
	import { systemLock } from "../stores/lockStore.svelte";
	import type { FlowNode, NodeType } from "../types";
	import CreateNodeDialog from "./CreateNodeDialog.svelte";
	import FloatingDock from "./FloatingDock.svelte";
	import ActionNode from "./nodes/ActionNode.svelte";
	import TaskNode from "./nodes/TaskNode.svelte";
	import TriggerNode from "./nodes/TriggerNode.svelte";
	import WorkflowManager from "./WorkflowManager.svelte";
	import { settings } from "@/states/settings.svelte";

	const nodeTypes: NodeTypes = {
		workflowStart: TriggerNode as unknown as ComponentType<
			SvelteComponent<
				NodeProps & {
					data: FlowNode["data"];
					type: FlowNode["type"];
				}
			>
		>,
		verifiableTask: TaskNode as unknown as ComponentType<
			SvelteComponent<
				NodeProps & {
					data: FlowNode["data"];
					type: FlowNode["type"];
				}
			>
		>,
		systemControl: ActionNode as unknown as ComponentType<
			SvelteComponent<
				NodeProps & {
					data: FlowNode["data"];
					type: FlowNode["type"];
				}
			>
		>,
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
		await settings.init();
		await workflowStore.init();
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

	<SvelteFlow
		{nodes}
		{edges}
		{nodeTypes}
		{defaultEdgeOptions}
		fitView
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
