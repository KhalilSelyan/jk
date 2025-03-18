<script lang="ts">
	import { Switch } from "$lib/components/ui/switch";
	import { Label } from "$lib/components/ui/label";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { settings } from "$lib/states/settings.svelte";
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogTrigger,
	} from "$lib/components/ui/alert-dialog/index";
	import { toast } from "svelte-sonner";
	import { Trash2 } from "lucide-svelte";
	import { Button } from "@/components/ui/button";
	import { Input } from "@/components/ui/input";

	let isOpen = $state(false);
	let newPasscode = $state("");

	const toggleLockFocus = async (enabled: boolean) => {
		settings.toggleLockFocus(enabled);
	};

	const handleClearDatabase = async () => {
		const success = await settings.clearDatabase();

		if (success) {
			toast.success("Database cleared successfully");
		} else {
			toast.error("Failed to clear database");
		}

		isOpen = false;
	};

	const handlePasscodeUpdate = () => {
		if (newPasscode.trim()) {
			settings.setPasscode(newPasscode);
			toast.success("Passcode updated successfully");
			newPasscode = "";
		}
	};
</script>

<main class="container mx-auto max-w-xl p-6">
	<Card>
		<CardHeader>
			<CardTitle>Application Settings</CardTitle>
		</CardHeader>
		<CardContent class="flex flex-col gap-2">
			<div class="flex items-center space-x-2">
				<Switch
					id="autostart"
					checked={settings.isAutostartEnabled}
					onCheckedChange={() => settings.toggleAutostart()}
				/>
				<Label for="autostart">Launch on system startup</Label>
			</div>
			<div class="flex items-center space-x-2">
				<Switch
					id="always-on-top"
					checked={settings.isAlwaysOnTop}
					onCheckedChange={(checked: boolean) => settings.toggleAlwaysOnTop(checked)}
				/>
				<Label for="always-on-top">Set Always On Top</Label>
			</div>
			<div class="flex items-center space-x-2">
				<Switch
					id="lock-focus"
					checked={settings.isLockFocusEnabled}
					onCheckedChange={toggleLockFocus}
				/>
				<Label for="lock-focus">Lock Focus (Prevent Window Switching)</Label>
			</div>
			<div class="my-2 border-t pt-4">
				<h3 class="mb-3 font-medium">Passcode Protection</h3>
				<div class="mb-4 flex items-center space-x-2">
					<Switch
						id="passcode-enabled"
						checked={settings.passcodeEnabled}
						onCheckedChange={(checked: boolean) => settings.togglePasscodeEnabled(checked)}
					/>
					<Label for="passcode-enabled">Enable Passcode Protection</Label>
				</div>
				{#if settings.passcodeEnabled}
					<div class="space-y-2">
						<Label for="passcode">Set Passcode</Label>
						<div class="flex space-x-2">
							<Input
								type="password"
								id="passcode"
								placeholder="New passcode"
								bind:value={newPasscode}
								class="flex-1"
							/>
							<Button variant="outline" onclick={handlePasscodeUpdate}>Save</Button>
						</div>
					</div>
				{/if}
			</div>
			<div class="border-t pt-4">
				<AlertDialog
					open={isOpen}
					onOpenChange={(val) => {
						isOpen = val;
					}}
				>
					<AlertDialogTrigger>
						<Button variant="destructive" class="w-full">
							<Trash2 class="mr-2 h-4 w-4" />

							Clear Database
						</Button>
					</AlertDialogTrigger>

					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>

							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete all your workflows,
								templates, and settings from the database.
							</AlertDialogDescription>
						</AlertDialogHeader>

						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>

							<AlertDialogAction
								class="bg-destructive text-foreground"
								onclick={handleClearDatabase}
							>
								Clear Database
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</CardContent>
	</Card>
</main>
