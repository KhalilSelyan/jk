<script lang="ts">
	import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
	import { Switch } from "$lib/components/ui/switch";
	import { Label } from "$lib/components/ui/label";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { invoke } from "@tauri-apps/api/core";
	import { db } from "@/db/database";
	import { ulid } from "ulid";

	let isAutostartEnabled = $state(false);
	let isAlwaysOnTop = $state(false);

	// Initialize autostart state
	async function initAutostart() {
		const setting = await db.settings.where("key").equals("isAutostart").first();
		const enabled = await isEnabled();
		isAutostartEnabled = setting?.value ?? enabled;

		// Create or update the setting
		if (!setting) {
			await db.settings.add({ id: ulid(), key: "isAutostart", value: enabled });
		} else if (setting.value !== enabled) {
			await db.settings.put({ id: setting.id, key: "isAutostart", value: enabled });
		}
	}

	// Toggle autostart
	async function toggleAutostart() {
		try {
			if (!isAutostartEnabled) {
				await enable();
			} else {
				await disable();
			}
			isAutostartEnabled = await isEnabled();
			const setting = await db.settings.where("key").equals("isAutostart").first();
			if (setting) {
				await db.settings.put({ id: setting.id, key: "isAutostart", value: isAutostartEnabled });
			}
			console.log(await isEnabled());
		} catch (error) {
			console.error("Failed to toggle autostart:", error);
		}
	}

	async function toggleAlwaysOnTop(alwaysOnTop: boolean) {
		try {
			await invoke("set_window_always_on_top", { alwaysOnTop });
			console.log(`Always on top set to: ${alwaysOnTop}`);
			isAlwaysOnTop = alwaysOnTop;
			const setting = await db.settings.where("key").equals("isAlwaysOnTop").first();
			if (setting) {
				await db.settings.put({ id: setting.id, key: "isAlwaysOnTop", value: alwaysOnTop });
			}
		} catch (error) {
			console.error("Failed to set always on top:", error);
		}
	}

	// Initialize always on top state
	async function initAlwaysOnTop() {
		const setting = await db.settings.where("key").equals("isAlwaysOnTop").first();
		isAlwaysOnTop = setting?.value ?? false;

		// Create the setting if it doesn't exist
		if (!setting) {
			await db.settings.add({ id: ulid(), key: "isAlwaysOnTop", value: false });
		}

		// Apply the always-on-top state if it's true
		if (isAlwaysOnTop) {
			await invoke("set_window_always_on_top", { alwaysOnTop: true });
		}
	}

	// Initialize on mount
	initAutostart();
	initAlwaysOnTop();
</script>

<Card class="container max-w-xl">
	<CardHeader>
		<CardTitle>Application Settings</CardTitle>
	</CardHeader>
	<CardContent class="flex flex-col gap-2">
		<div class="flex items-center space-x-2">
			<Switch id="autostart" checked={isAutostartEnabled} onCheckedChange={toggleAutostart} />
			<Label for="autostart">Launch on system startup</Label>
		</div>
		<div class="flex items-center space-x-2">
			<Switch id="autostart" checked={isAlwaysOnTop} onCheckedChange={toggleAlwaysOnTop} />
			<Label for="autostart">Set Always On Top</Label>
		</div>
	</CardContent>
</Card>
