import { db } from "@/db/database";
import { getSystemLock } from "@/stores/lockStore.svelte";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { ulid } from "ulid";

class Settings {
	isAutostartEnabled = $state(false);
	isAlwaysOnTop = $state(false);
	isLockFocusEnabled = $state(false);
	isListening = $state(false);
	passcode = $state("1234"); // Default passcode
	passcodeEnabled = $state(false);
	isGettingDragged = $state(false);

	constructor() {
		this.isLockFocusEnabled = false;
	}

	async init() {
		await Promise.all([
			this.initAutostart(),
			this.initAlwaysOnTop(),
			this.initLockState(),
			this.initPasscode(),
		]);
	}

	async clearDatabase() {
		try {
			await db.delete();

			await db.open();

			// Reinitialize settings after clearing

			await this.init();

			return true;
		} catch (error) {
			console.error("Failed to clear database:", error);

			return false;
		}
	}

	private async initAutostart() {
		const setting = await db.settings.where("key").equals("isAutostart").first();
		let enabled = $state(await isEnabled());
		if (!enabled) {
			await enable();
			enabled = true;
		}
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

		if (this.isAlwaysOnTop) {
			await invoke("set_window_always_on_top", { alwaysOnTop: true });
		}
	}

	async initLockState() {
		const hasLockedNode = Array.from(getSystemLock().values()).some((isLocked) => isLocked);

		this.isLockFocusEnabled = hasLockedNode;
		if (!hasLockedNode) {
			await this.toggleAlwaysOnTop(false);
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

	async toggleAlwaysOnTop(value: boolean) {
		this.isAlwaysOnTop = value;
		try {
			await invoke("set_window_always_on_top", { alwaysOnTop: value });
			const setting = await db.settings.where("key").equals("isAlwaysOnTop").first();
			if (setting) {
				await db.settings.put({ id: setting.id, key: "isAlwaysOnTop", value });
			}

			await this.toggleFullscreen(value);
		} catch (error) {
			console.error("Failed to set always on top:", error);
		}
	}

	toggleLockFocus(value: boolean) {
		this.isLockFocusEnabled = value;
	}

	async toggleFullscreen(value: boolean) {
		try {
			if (value) {
				await getCurrentWindow().setFullscreen(true);
			} else {
				await getCurrentWindow().setFullscreen(false);
			}
		} catch (error) {
			console.error("Failed to toggle fullscreen:", error);
		}
	}

	setListening(value: boolean) {
		this.isListening = value;
	}

	setIsGettingDragged(value: boolean) {
		this.isGettingDragged = value;
	}

	private async initPasscode() {
		const passcodeSettings = await db.settings.where("key").equals("passcode").first();
		const passcodeEnabledSettings = await db.settings
			.where("key")
			.equals("passcodeEnabled")
			.first();

		this.passcode = passcodeSettings?.value ?? "1234";
		this.passcodeEnabled = passcodeEnabledSettings?.value ?? false;

		if (!passcodeSettings) {
			await db.settings.add({ id: ulid(), key: "passcode", value: "1234" });
		}

		if (!passcodeEnabledSettings) {
			await db.settings.add({ id: ulid(), key: "passcodeEnabled", value: false });
		}
	}

	async setPasscode(newPasscode: string) {
		this.passcode = newPasscode;

		const passcodeSettings = await db.settings.where("key").equals("passcode").first();
		if (passcodeSettings) {
			await db.settings.put({
				id: passcodeSettings.id,
				key: "passcode",
				value: newPasscode,
			});
		}
	}

	async togglePasscodeEnabled(value: boolean) {
		this.passcodeEnabled = value;

		const passcodeEnabledSettings = await db.settings
			.where("key")
			.equals("passcodeEnabled")
			.first();
		if (passcodeEnabledSettings) {
			await db.settings.put({
				id: passcodeEnabledSettings.id,
				key: "passcodeEnabled",
				value,
			});
		}
	}

	verifyPasscode(enteredPasscode: string): boolean {
		return this.passcode === enteredPasscode;
	}
}

export const settings = new Settings();
