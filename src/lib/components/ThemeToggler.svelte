<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";

	import { toggleMode } from "mode-watcher";

	import { cn } from "$lib/utils";

	import { Button } from "$lib/components/ui/button";
	import { Moon, Sun } from "lucide-svelte";

	type Props = {
		class?: HTMLAttributes<HTMLElement>["class"];
	};

	const { class: className }: Props = $props();
</script>

<Button
	onclick={() => toggleMode()}
	size="icon"
	variant="ghost"
	class={cn("rounded-full", className)}
>
	<Sun class="text-xl dark:hidden"></Sun>
	<Moon class="hidden text-xl dark:block"></Moon>

	<span class="sr-only">Toggle theme</span>
</Button>
