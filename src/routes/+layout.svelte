<script lang="ts">
	import Header from "@/components/Header.svelte";
	import { exit } from "@tauri-apps/plugin-process";
	import { ModeWatcher } from "mode-watcher";
	import "../app.css";
	let { children } = $props();

	$effect(() => {
		const handleKeyDown = async (e: KeyboardEvent) => {
			if (e.ctrlKey && !e.shiftKey && e.key === "q") {
				// Close window using Tauri API
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
