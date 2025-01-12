<script lang="ts">
	import { Scroll, Sword, WandSparkles } from "lucide-svelte";
	import type { NodeType } from "../types";
	import { buttonConfigs } from "./icons.svelte";

	let { openDialog }: { openDialog: ({ type }: { type: NodeType }) => void } = $props();

	function handleClick(type: NodeType) {
		openDialog({ type });
	}
</script>

<div
	class="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-4 rounded-lg bg-background p-4 shadow-lg"
>
	{#each buttonConfigs.quest as { type, icon: Icon, label, color }}
		<button
			class="flex items-center gap-2 rounded-md px-4 py-2 text-xs text-background transition-colors hover:opacity-90 {color}"
			onclick={() => handleClick(type)}
		>
			<Icon size={20} />
			{label}
		</button>
	{/each}
</div>
