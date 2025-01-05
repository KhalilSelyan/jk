import Dexie, { type Table } from "dexie";
import type { Workflow } from "../types";

interface Settings {
	id?: string;
	key: string;
	value: any;
}

export class FlowDatabase extends Dexie {
	settings!: Table<Settings>;
	workflows!: Table<Workflow>;

	constructor() {
		super("flowDatabase");
		this.version(3).stores({
			settings: "id, key",
			workflows: "++id, name, isTemplate, dayOfWeek, createdAt, updatedAt",
		});
	}
}

export const db = new FlowDatabase();
