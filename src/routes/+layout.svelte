<script lang="ts">
	import { goto } from "$app/navigation";
	import { settings } from "$lib/states/settings.svelte";
	import Header from "@/components/Header.svelte";
	import { route } from "@/ROUTES";
	import { workflowStore } from "@/stores/workflowStore.svelte";
	import { invoke } from "@tauri-apps/api/core";
	import { listen } from "@tauri-apps/api/event";
	import { exit } from "@tauri-apps/plugin-process";
	import { ModeWatcher } from "mode-watcher";
	import { onMount } from "svelte";
	import "../app.css";
	import { taskStore } from "@/stores/taskStore.svelte";

	let { children } = $props();

	onMount(() => {
		function handleRightClick(e: MouseEvent) {
			e.preventDefault(); // Prevent the default context menu from appearing
		}

		function handleKeyDown(e: KeyboardEvent) {
			if (e.ctrlKey && !e.shiftKey && e.key === "q") {
				exit(0);
			}
			if (e.ctrlKey && e.key === "1") {
				goto(route("/"));
			}
			if (e.ctrlKey && e.key === "2") {
				goto(route("/settings"));
			}
			if (e.ctrlKey && e.key === "r") {
				window.location.reload();
			}
		}

		window.addEventListener("contextmenu", handleRightClick);
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			// Cleanup
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("contextmenu", handleRightClick);
		};
	});

	// 2. Setup variables to store unlisten callback(s)
	let unlistenFocusChanged = $state<undefined | (() => void)>(undefined);

	async function startListening() {
		try {
			// Start the Tauri "window monitor"
			await invoke("start_window_monitor");

			// Listen for "window-focus-changed"
			unlistenFocusChanged = await listen("window-focus-changed", (event) => {
				const activeWindowTitle = event.payload as string;
				if (activeWindowTitle !== "jk" && settings.isLockFocusEnabled) {
					settings.toggleAlwaysOnTop(true);
					settings.toggleFullscreen(true);
					focusJkWindow();
				}
			});
		} catch (error) {
			console.error("Failed to start window monitor:", error);
			// Clean up if monitoring fails
			stopListening();
		}
	}

	function stopListening() {
		try {
			// Clean up the event listener if it exists
			if (unlistenFocusChanged) {
				unlistenFocusChanged();
				unlistenFocusChanged = undefined;
			}
			// Stop the Rust window monitor
			invoke("stop_window_monitor");
		} catch (error) {
			console.error("Failed to stop window monitor:", error);
		}
	}

	async function focusJkWindow() {
		const windows = (await invoke("list_windows")) as [number, string][];
		const jkWindow = windows.find(([_, title]) => title === "jk");
		if (jkWindow) {
			invoke("focus_window", { windowId: jkWindow[0] });
		}
	}

	// 3. Reactive block that toggles the focus lock logic
	$effect(() => {
		if (settings.isLockFocusEnabled) {
			// Start listening if not already
			startListening();
		} else {
			// Stop listening if the user turns off lock focus
			stopListening();
		}
	});

	onMount(async () => {
		await taskStore.init();
		await settings.init();
		await workflowStore.init();
	});
</script>

<ModeWatcher />

<main class="container">
	<Header />
	{@render children()}
</main>
