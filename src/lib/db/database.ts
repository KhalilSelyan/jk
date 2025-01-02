import Dexie, { type Table } from "dexie";
import type { FlowNode, FlowEdge } from "../types";

// Add interface for settings
interface Settings {
	id?: string;
	key: string;
	value: any;
}

export class FlowDatabase extends Dexie {
	nodes!: Table<FlowNode>;
	edges!: Table<FlowEdge>;
	settings!: Table<Settings>; // Add settings table

	constructor() {
		super("flowDatabase");
		this.version(1).stores({
			nodes: "id, type",
			edges: "id, source, target",
			settings: "id, key", // Add settings table schema
		});
	}
}

export const db = new FlowDatabase();
