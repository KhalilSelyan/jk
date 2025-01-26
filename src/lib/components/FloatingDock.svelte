<script lang="ts">
	import type { NodeType } from "../types";
	import { buttonConfigs } from "./icons.svelte";

	let {
		openDialog,
		isDialogOpen = $bindable(false),
	}: {
		openDialog: ({ type }: { type: NodeType }) => void;
		isDialogOpen?: boolean;
	} = $props();

	function handleClick(type: NodeType) {
		openDialog({ type });
	}

	$effect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (isDialogOpen) return;

			const key = event.key;
			if (key >= "1" && key <= "3" && !event.ctrlKey) {
				const index = Number(key) - 1;
				const buttonConfig = buttonConfigs.quest[index];
				if (buttonConfig) {
					handleClick(buttonConfig.type);
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	});
</script>

<div
	class="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-4 rounded-lg bg-transparent p-4 shadow-lg"
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
