<script lang="ts">
	import { Button } from "@/components/ui/button";
	import { Input } from "@/components/ui/input";
	import { settings } from "$lib/states/settings.svelte";
	import { goto } from "$app/navigation";
	import { route } from "$lib/ROUTES";
	import { taskStore } from "@/stores/taskStore.svelte";
	import { toast } from "svelte-sonner";
	import { workflowStore } from "@/stores/workflowStore.svelte";

	let passcode = "";
	let unlockInProgress = false;

	async function handleUnlock() {
		if (passcode.trim() === "") return;

		unlockInProgress = true;

		try {
			if (settings.verifyPasscode(passcode)) {
				// Get all unvalidated tasks that are in schedule
				const unvalidatedTasks = taskStore.tasks.filter(
					(node) =>
						node.type === "verifiableTask" &&
						!node.data.validated &&
						taskStore.isTaskInSchedule(node)
				);

				// Validate all unvalidated tasks
				for (const task of unvalidatedTasks) {
					await taskStore.validateTask(task.id, "passcode validated");
				}

				// Unlock any locked tasks
				const lockedSystemControls = taskStore.tasks.filter(
					(node) => node.type === "systemControl" && node.data.isLocked
				);

				for (const control of lockedSystemControls) {
					// Create safe control object
					const safeControl = JSON.parse(
						JSON.stringify({
							...control,
							data: {
								...control.data,
								isLocked: false,
							},
						})
					);

					// Update database
					await workflowStore.updateNode(control.id, safeControl);
				}

				// Disable lock focus and always on top
				await settings.togglePasscodeEnabled(false);

				toast.success("App unlocked and tasks validated successfully!");

				// Redirect to home page
				goto(route("/"));
			} else {
				toast.error("Incorrect passcode. Please try again.");
			}
		} catch (error) {
			console.error("Error unlocking app:", error);
			toast.error("Error unlocking app. Please try again.");
		} finally {
			unlockInProgress = false;
			passcode = "";
		}
	}
</script>

<div class="flex h-screen flex-col items-center justify-center">
	<div class="w-full max-w-md space-y-8 rounded-lg bg-card p-8 shadow-lg">
		<div class="text-center">
			<h1 class="text-3xl font-bold">Unlock App</h1>
			<p class="text-muted-foreground mt-2">Enter passcode to unlock settings and locked tasks</p>
		</div>

		<form on:submit|preventDefault={handleUnlock} class="space-y-6">
			<div class="space-y-2">
				<Input
					type="password"
					placeholder="Enter passcode"
					bind:value={passcode}
					class="text-center text-2xl tracking-widest"
					maxlength={10}
				/>
			</div>

			<Button type="submit" class="w-full" disabled={unlockInProgress}>
				{#if unlockInProgress}
					Unlocking...
				{:else}
					Unlock
				{/if}
			</Button>
		</form>
	</div>
</div>
