<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { route } from "$lib/ROUTES";
	import { settings } from "$lib/states/settings.svelte";
	import Header from "@/components/Header.svelte";
	import { Toaster } from "@/components/ui/sonner";
	import { flowStore } from "@/stores/flowStore.svelte";
	import { getSystemLock } from "@/stores/lockStore.svelte";
	import { taskStore } from "@/stores/taskStore.svelte";
	import { workflowStore } from "@/stores/workflowStore.svelte";
	import { invoke } from "@tauri-apps/api/core";
	import { listen } from "@tauri-apps/api/event";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { SvelteFlowProvider } from "@xyflow/svelte";
	import "@xyflow/svelte/dist/style.css";
	import { ModeWatcher } from "mode-watcher";
	import { onMount } from "svelte";
	import "../app.css";

	let { children } = $props();

	onMount(() => {
		function handleRightClick(e: MouseEvent) {
			e.preventDefault(); // Prevent the default context menu from appearing
		}

		function handleKeyDown(e: KeyboardEvent) {
			// if (e.ctrlKey && !e.shiftKey && e.key === "q") {
			// 	exit(0);
			// }
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
		if (settings.isListening) return;
		try {
			// Start the Tauri "window monitor"
			await invoke("start_window_monitor");
			settings.setListening(true);
			// Listen for "window-focus-changed"
			unlistenFocusChanged = await listen("window-focus-changed", (event) => {
				const activeWindowTitle = event.payload as string;
				if (activeWindowTitle !== "jk" && settings.isLockFocusEnabled) {
					settings.toggleAlwaysOnTop(true);
					settings.toggleFullscreen(true);
					focusJkWindow();
				}
				if (activeWindowTitle === "Select File") {
					settings.setIsPickingFile(true);
				}
			});
		} catch (error) {
			console.error("Failed to start window monitor:", error);
			// Clean up if monitoring fails
			stopListening();
		}
	}

	function stopListening() {
		if (!settings.isListening) return;
		try {
			// Clean up the event listener if it exists
			if (unlistenFocusChanged) {
				unlistenFocusChanged();
				unlistenFocusChanged = undefined;
			}
			// Stop the Rust window monitor
			invoke("stop_window_monitor");
			settings.setListening(false);
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

	$effect(() => {
		const hasLockedNode = Array.from(getSystemLock().values()).some((isLocked) => isLocked);

		if (settings.isLockFocusEnabled !== hasLockedNode) {
			settings.toggleLockFocus(hasLockedNode);
			settings.toggleAlwaysOnTop(hasLockedNode);
		}
	});

	getCurrentWindow().listen("tauri://blur", async (e) => {
		// Check if window is currently being dragged and skip hiding if it is
		if (settings.isGettingDragged) {
			return;
		}

		if (!settings.isAlwaysOnTop || !settings.isLockFocusEnabled || !settings.isListening)
			await getCurrentWindow().hide();
	});

	getCurrentWindow().listen("tauri://focus", async (e) => {
		// Check if window is currently being dragged and skip hiding if it is
		if (settings.isGettingDragged || settings.isPickingFile) {
			return;
		}

		if (settings.isAlwaysOnTop || settings.isLockFocusEnabled || settings.isListening) {
			await settings.togglePasscodeEnabled(true);
		}
	});

	onMount(async () => {
		await taskStore.init();
		await settings.init();
		await workflowStore.init();
	});

	$effect(() => {
		// Redirect to passcode page if any node is locked and passcode is enabled
		const hasLockedNode = Array.from(getSystemLock().values()).some((isLocked) => isLocked);
		const isPasscodeEnabled = settings.passcodeEnabled;
		const currentPath = $page.url.pathname;

		if (hasLockedNode && isPasscodeEnabled && currentPath !== "/passcode") {
			goto("/passcode");
		}
	});
</script>

<ModeWatcher defaultMode="dark" />
<Toaster richColors position="bottom-center" />

<main>
	<Header />
	<SvelteFlowProvider initialNodes={flowStore.nodess} initialEdges={flowStore.edgess}>
		{@render children()}
	</SvelteFlowProvider>
</main>
