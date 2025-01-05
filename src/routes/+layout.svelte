<script lang="ts">
	import Header from "@/components/Header.svelte";
	import { exit } from "@tauri-apps/plugin-process";
	import { ModeWatcher } from "mode-watcher";
	import { settings } from "$lib/states/settings.svelte";
	import "../app.css";
	import { workflowStore } from "@/stores/workflowStore.svelte";

	let { children } = $props();

	$effect(() => {
		// Initialize settings when the app starts
		settings.init();
		workflowStore.init();
		const handleKeyDown = async (e: KeyboardEvent) => {
			if (e.ctrlKey && !e.shiftKey && e.key === "q") {
				await exit(0);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	});
</script>

<ModeWatcher />

<main class="container">
	<Header />
	{@render children()}
</main>
