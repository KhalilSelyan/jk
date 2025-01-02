import { db } from "@/db/database";
import { invoke } from "@tauri-apps/api/core";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { ulid } from "ulid";

class Settings {
	isAutostartEnabled = $state(false);
	isAlwaysOnTop = $state(false);

	async init() {
		await Promise.all([this.initAutostart(), this.initAlwaysOnTop()]);
	}

	private async initAutostart() {
		const setting = await db.settings.where("key").equals("isAutostart").first();
		const enabled = await isEnabled();
		this.isAutostartEnabled = setting?.value ?? enabled;

		if (!setting) {
			await db.settings.add({ id: ulid(), key: "isAutostart", value: enabled });
		} else if (setting.value !== enabled) {
			await db.settings.put({ id: setting.id, key: "isAutostart", value: enabled });
		}
	}

	private async initAlwaysOnTop() {
		const setting = await db.settings.where("key").equals("isAlwaysOnTop").first();
		this.isAlwaysOnTop = setting?.value ?? false;

		if (!setting) {
			await db.settings.add({ id: ulid(), key: "isAlwaysOnTop", value: false });
		}

		// Apply the always-on-top state if it's true
		if (this.isAlwaysOnTop) {
			await invoke("set_window_always_on_top", { alwaysOnTop: true });
		}
	}

	async toggleAutostart() {
		try {
			if (!this.isAutostartEnabled) {
				await enable();
			} else {
				await disable();
			}
			this.isAutostartEnabled = await isEnabled();
			const setting = await db.settings.where("key").equals("isAutostart").first();
			if (setting) {
				await db.settings.put({
					id: setting.id,
					key: "isAutostart",
					value: this.isAutostartEnabled,
				});
			}
		} catch (error) {
			console.error("Failed to toggle autostart:", error);
		}
	}

	async toggleAlwaysOnTop(alwaysOnTop: boolean) {
		try {
			await invoke("set_window_always_on_top", { alwaysOnTop });
			this.isAlwaysOnTop = alwaysOnTop;
			const setting = await db.settings.where("key").equals("isAlwaysOnTop").first();
			if (setting) {
				await db.settings.put({ id: setting.id, key: "isAlwaysOnTop", value: alwaysOnTop });
			}
		} catch (error) {
			console.error("Failed to set always on top:", error);
		}
	}
}

export const settings = new Settings();
