<script lang="ts">
	import { ListTodo, Wifi, Zap } from "lucide-svelte";
	import type { NodeType } from "../types";

	let { openDialog }: { openDialog: ({ type }: { type: NodeType }) => void } = $props();

	const buttons = [
		{ type: "workflowStart", icon: Zap, label: "Add Trigger", color: "bg-rose-500" },
		{ type: "verifiableTask", icon: ListTodo, label: "Add Task", color: "bg-violet-500" },
		{ type: "systemControl", icon: Wifi, label: "Add Action", color: "bg-indigo-500" },
	] as const;

	function handleClick(type: NodeType) {
		openDialog({ type });
	}
</script>

<div
	class="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-4 rounded-lg bg-background p-4 shadow-lg"
>
	{#each buttons as { type, icon: Icon, label, color }}
		<button
			class="flex items-center gap-2 rounded-md px-4 py-2 text-background transition-colors hover:opacity-90 {color}"
			onclick={() => handleClick(type)}
		>
			<Icon size={20} />
			{label}
		</button>
	{/each}
</div>
