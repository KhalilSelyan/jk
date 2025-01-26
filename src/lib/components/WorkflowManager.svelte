<script lang="ts">
	import { Button, buttonVariants } from "$lib/components/ui/button";
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { flowStore } from "@/stores/flowStore.svelte";
	import { DAYS, workflowStore } from "@/stores/workflowStore.svelte";
	import type { FlowEdge, FlowNode } from "@/types";
	import { cn } from "@/utils";
	import { Calendar as CalendarIcon, ChevronDown } from "lucide-svelte";
	import { onDestroy } from "svelte";

	function getCurrentDayIndex() {
		const today = new Date().getDay();
		return today === 0 ? 6 : today - 1;
	}

	let selectedDay = $state(getCurrentDayIndex());
	let showSaveDialog = $state(false);
	let templateName = $state("");
	let lastUpdate = $state<{
		nodes: FlowNode[];
		edges: FlowEdge[];
	}>({ nodes: [], edges: [] });
	let updateTimeout: number;
	let availableDays = $state<number[]>([]);

	$effect(() => {
		handleDaySelect(selectedDay);
	});

	// Load available days when workflows change
	$effect(() => {
		const days = workflowStore.workflows
			.filter((w) => w.dayOfWeek !== undefined)
			.map((w) => w.dayOfWeek!);
		availableDays = days;
	});

	async function handleDaySelect(day: number) {
		if (day === getCurrentDayIndex()) return;

		const sourceWorkflow = await workflowStore.getWorkflowForDay(day);
		if (!sourceWorkflow) return;

		const todayIndex = getCurrentDayIndex();
		const todayWorkflow = await workflowStore.getWorkflowForDay(todayIndex);

		if (todayWorkflow) {
			await workflowStore.updateWorkflow(todayWorkflow.id!, {
				nodes: sourceWorkflow.nodes,
				edges: sourceWorkflow.edges,
			});
		} else {
			await workflowStore.saveWorkflow(
				`${DAYS[todayIndex]} Workflow`,
				sourceWorkflow.nodes,
				sourceWorkflow.edges,
				todayIndex
			);
		}

		const updatedWorkflow = await workflowStore.getWorkflowForDay(todayIndex);
		if (updatedWorkflow?.id) {
			await workflowStore.loadWorkflow(updatedWorkflow.id);
		}

		// Reset selectedDay to today
		selectedDay = todayIndex;
	}

	async function saveAsTemplate() {
		if (!templateName) return;
		await workflowStore.saveTemplate(templateName, flowStore.nodes as FlowNode[], flowStore.edges);
		templateName = "";
		showSaveDialog = false;
	}

	async function applyTemplate(templateId: string) {
		await workflowStore.applyTemplate(templateId, selectedDay);
		const workflow = await workflowStore.getWorkflowForDay(selectedDay);
		if (workflow) {
			flowStore.setNodes(workflow.nodes);
			flowStore.setEdges(workflow.edges);
		}
	}

	// async function saveCurrentWorkflow() {
	// 	await workflowStore.saveWorkflow(`${DAYS[selectedDay]} Workflow`, $nodes, $edges, selectedDay);
	// }

	// Auto-save when nodes or edges change
	$effect(() => {
		if (!workflowStore.currentWorkflowId) return;

		// Check if the content actually changed
		const nodesChanged = JSON.stringify(flowStore.nodes) !== JSON.stringify(lastUpdate.nodes);
		const edgesChanged = JSON.stringify(flowStore.edges) !== JSON.stringify(lastUpdate.edges);

		if (!nodesChanged && !edgesChanged) return;

		// Update last known state
		lastUpdate = { nodes: flowStore.nodes as FlowNode[], edges: flowStore.edges };

		// Debounce the update
		clearTimeout(updateTimeout);
		updateTimeout = setTimeout(() => {
			console.log("updating");
			workflowStore.updateWorkflow(workflowStore.currentWorkflowId!, {
				nodes: flowStore.nodes as FlowNode[],
				edges: flowStore.edges,
			});
		}, 500) as unknown as number;
	});

	onDestroy(() => {
		clearTimeout(updateTimeout);
	});
</script>

<div class="flex items-center gap-4">
	<DropdownMenu>
		<DropdownMenuTrigger
			class={cn(buttonVariants({ variant: "outline" }), "w-[200px] justify-between")}
		>
			Copy from {DAYS[selectedDay] !== DAYS[getCurrentDayIndex()] ? `${DAYS[selectedDay]}` : ""}
			<ChevronDown class="h-4 w-4 opacity-50" />
		</DropdownMenuTrigger>
		<DropdownMenuContent class="w-[200px]">
			<DropdownMenuLabel>Copy Workflow From</DropdownMenuLabel>
			<DropdownMenuSeparator />
			{#each DAYS as day, index}
				{#if availableDays.includes(index)}
					<DropdownMenuItem
						onclick={() => handleDaySelect(index)}
						class={cn({
							"pointer-events-none opacity-50": DAYS[selectedDay] === DAYS[index],
						})}
					>
						{day}
					</DropdownMenuItem>
				{/if}
			{/each}
		</DropdownMenuContent>
	</DropdownMenu>

	<!-- <Button variant="outline" onclick={async () => await saveCurrentWorkflow()}>
		<Save class="mr-2 h-4 w-4" />
			Save Workflow
	</Button> -->

	<Button variant="outline" onclick={() => (showSaveDialog = true)}>Save as Template</Button>

	<DropdownMenu>
		<DropdownMenuTrigger class={cn(buttonVariants({ variant: "outline" }))}>
			<CalendarIcon class="mr-2 h-4 w-4" />
			Apply Template
		</DropdownMenuTrigger>
		<DropdownMenuContent>
			<DropdownMenuLabel>Templates</DropdownMenuLabel>
			<DropdownMenuSeparator />
			{#each workflowStore.templates as template}
				<DropdownMenuItem onclick={() => applyTemplate(template.id!)}>
					{template.name}
				</DropdownMenuItem>
			{/each}
		</DropdownMenuContent>
	</DropdownMenu>
</div>

<Dialog bind:open={showSaveDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Save as Template</DialogTitle>
		</DialogHeader>
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="name">Template Name</Label>
				<Input id="name" bind:value={templateName} />
			</div>
		</div>
		<div class="flex justify-end gap-2">
			<Button variant="outline" onclick={() => (showSaveDialog = false)}>Cancel</Button>
			<Button onclick={saveAsTemplate}>Save</Button>
		</div>
	</DialogContent>
</Dialog>
