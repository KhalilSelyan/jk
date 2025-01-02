import Dexie, { type Table } from "dexie";
import type { FlowNode, FlowEdge } from "../types";

interface Settings {
	id?: string;
	key: string;
	value: any;
}

// New interfaces for workflow management
interface Workflow {
	id?: string;
	name: string;
	description?: string;
	isTemplate: boolean;
	dayOfWeek?: number; // 0-6 for Sunday-Saturday
	nodes: FlowNode[];
	edges: FlowEdge[];
	createdAt: Date;
	updatedAt: Date;
}

export class FlowDatabase extends Dexie {
	nodes!: Table<FlowNode>;
	edges!: Table<FlowEdge>;
	settings!: Table<Settings>;
	workflows!: Table<Workflow>; // New table for workflows

	constructor() {
		super("flowDatabase");
		this.version(2).stores({
			nodes: "id, type",
			edges: "id, source, target",
			settings: "id, key",
			workflows: "++id, name, isTemplate, dayOfWeek, createdAt, updatedAt", // Index these fields for querying
		});
	}
}

export const db = new FlowDatabase();

// Utility functions for workflow management
export async function saveWorkflow(
	name: string,
	nodes: FlowNode[],
	edges: FlowEdge[],
	isTemplate = false,
	dayOfWeek?: number
) {
	return await db.workflows.add({
		name,
		nodes,
		edges,
		isTemplate,
		dayOfWeek,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
}

export async function getTemplateForDay(dayOfWeek: number) {
	return await db.workflows
		.where("dayOfWeek")
		.equals(dayOfWeek)
		.and((workflow) => workflow.isTemplate)
		.first();
}

export async function getAllWorkflows(templatesOnly = false) {
	return await db.workflows.filter((workflow) => workflow.isTemplate === templatesOnly).toArray();
}
