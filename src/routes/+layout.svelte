<script lang="ts">
	import Header from "@/components/Header.svelte";
	import { exit } from "@tauri-apps/plugin-process";
	import { ModeWatcher } from "mode-watcher";
	import { settings } from "$lib/states/settings.svelte";
	import "../app.css";
	import { workflowStore } from "@/stores/workflowStore.svelte";
	import { route, routes } from "@/ROUTES";
	import { goto } from "$app/navigation";

	let { children } = $props();

	$effect(() => {
		// Initialize settings when the app starts
		settings.init();
		workflowStore.init();
		const handleKeyDown = async (e: KeyboardEvent) => {
			if (e.ctrlKey && !e.shiftKey && e.key === "q") {
				await exit(0);
			}

			if (e.ctrlKey && e.key === "1") {
				goto(route("/"));
			}
			if (e.ctrlKey && e.key === "2") {
				goto(route("/settings"));
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
