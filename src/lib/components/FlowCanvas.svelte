<script lang="ts">
	import { settings } from "@/states/settings.svelte";
	import { flowStore } from "@/stores/flowStore.svelte";
	import { taskStore } from "@/stores/taskStore.svelte";
	import { workflowStore } from "@/stores/workflowStore.svelte";
	import {
		Background,
		BackgroundVariant,
		Controls,
		MiniMap,
		SvelteFlow,
		type DefaultEdgeOptions,
		type EdgeTypes,
		type NodeTargetEventWithPointer,
		type NodeTypes,
		type ProOptions,
	} from "@xyflow/svelte";
	import { mode } from "mode-watcher";
	import { onMount } from "svelte";
	import { ulid } from "ulid";
	import type { FlowNode, NodeType } from "../types";
	import CreateNodeDialog from "./CreateNodeDialog.svelte";
	import CustomEdge from "./edges/CustomEdge.svelte";
	import SvgEdge from "./edges/svgEdge.svelte";
	import FloatingDock from "./FloatingDock.svelte";
	import ActionNode from "./nodes/ActionNode.svelte";
	import TaskNode from "./nodes/TaskNode.svelte";
	import TriggerNode from "./nodes/TriggerNode.svelte";
	import WorkflowManager from "./WorkflowManager.svelte";

	const nodeTypes: NodeTypes = {
		workflowStart: TriggerNode,
		verifiableTask: TaskNode,
		systemControl: ActionNode,
	};

	const edgeTypes: EdgeTypes = {
		customEdge: CustomEdge,
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

	function handleNodeDragStop(
		event: Parameters<NodeTargetEventWithPointer<MouseEvent | TouchEvent>>[0]
	) {
		if (!event.targetNode) return;
		console.log(event.targetNode);
		const { id, position } = event.targetNode;
		workflowStore.updateNodePosition(id, position);
	}

	const defaultEdgeOptions: DefaultEdgeOptions = {
		type: "customEdge",
		animated: true,
		interactionWidth: 10,
		hidden: false,
		deletable: false,
		selectable: true,
		zIndex: 12,
	};

	// Get current day index (0-6, Monday-Sunday)
	function getCurrentDayIndex() {
		const today = new Date().getDay();
		return today === 0 ? 6 : today - 1;
	}

	onMount(async () => {
		await settings.init();
		await Promise.all([taskStore.init(), workflowStore.init()]);

		const currentDay = getCurrentDayIndex();
		const workflow = await workflowStore.getWorkflowForDay(currentDay);
		if (!workflow?.id) return;
		await workflowStore.loadWorkflow(workflow.id);
		await settings.initLockState();
	});

	const proOptions: ProOptions = {
		hideAttribution: true,
		account: undefined,
	};
</script>

<div class="relative h-[90dvh] w-full rounded-lg shadow-md">
	<div class="absolute left-4 right-4 top-4 z-50">
		<WorkflowManager />
	</div>

	<SvelteFlow
		bind:nodes={flowStore.nodes}
		bind:edges={flowStore.edges}
		{nodeTypes}
		{edgeTypes}
		{defaultEdgeOptions}
		fitView
		connectionRadius={40}
		snapGrid={[15, 15]}
		maxZoom={2}
		minZoom={0.1}
		colorMode={$mode ?? "dark"}
		connectionLineComponent={SvgEdge}
		onlyRenderVisibleElements
		{proOptions}
		onnodedragstop={handleNodeDragStop}
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
		<Background
			variant={BackgroundVariant.Dots}
			gap={24}
			bgColor="var(--muted)"
			class="!bg-background"
		/>
		<Controls class="!bg-background" />
		<MiniMap
			inversePan
			zoomable
			pannable
			position="bottom-right"
			height={120}
			class="!bg-background"
		/>
		<FloatingDock openDialog={handleOpenDialog} isDialogOpen={showDialog} />
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
