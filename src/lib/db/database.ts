import Dexie, { type Table } from "dexie";
import type { FlowNode, FlowEdge } from "../types";

export class FlowDatabase extends Dexie {
	nodes!: Table<FlowNode>;
	edges!: Table<FlowEdge>;

	constructor() {
		super("flowDatabase");
		this.version(1).stores({
			nodes: "id, type",
			edges: "id, source, target",
		});
	}
}

export const db = new FlowDatabase();
