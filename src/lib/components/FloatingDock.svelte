<script lang="ts">
	import { Button } from "@/components/ui/button";
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

	const Config = buttonConfigs.quest;
</script>

<div
	class="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-4 rounded-lg border border-border bg-card p-4 shadow-lg"
>
	<Button
		variant="ghost"
		class="h-10 w-10 rounded-full bg-primary-200 text-foreground hover:bg-primary-100"
		onclick={() => openDialog({ type: "workflowStart" })}
	>
		{@const SvelteComponent = Config[0].icon}
		<SvelteComponent class="h-5 w-5" />
	</Button>
	<Button
		variant="ghost"
		class="h-10 w-10 rounded-full bg-primary-200 text-foreground hover:bg-primary-100"
		onclick={() => openDialog({ type: "verifiableTask" })}
	>
		{@const SvelteComponent_1 = Config[1].icon}
		<SvelteComponent_1 class="h-5 w-5" />
	</Button>
	<Button
		variant="ghost"
		class="h-10 w-10 rounded-full bg-primary-200 text-foreground hover:bg-primary-100"
		onclick={() => openDialog({ type: "systemControl" })}
	>
		{@const SvelteComponent_2 = Config[2].icon}
		<SvelteComponent_2 class="h-5 w-5" />
	</Button>
</div>
