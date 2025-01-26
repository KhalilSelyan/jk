interface BaseNode {
	id: string;
	position: { x: number; y: number };
	data: {
		title: string;
		description: string;
		icon: string;
	};
}

export interface WorkflowStartNode extends BaseNode {
	type: "workflowStart";
	data: BaseNode["data"] & {
		triggerTime?: string;
	};
}

export interface VerifiableTaskNode extends BaseNode {
	type: "verifiableTask";
	data: BaseNode["data"] & {
		validated: boolean;
		imageProof?: string;
		schedule?: {
			startTime: string;
			endTime: string;
			days: Record<number, boolean>; // 0-6 for days of week
		};
	};
}

export interface SystemControlNode extends BaseNode {
	type: "systemControl";
	data: BaseNode["data"] & {
		lockType: "wifi" | "apps" | "entertainment";
		isLocked: boolean;
	};
}

export type FlowNode = WorkflowStartNode | VerifiableTaskNode | SystemControlNode;

export interface FlowEdge {
	id: string;
	source: string;
	target: string;
}

export type NodeType = "workflowStart" | "verifiableTask" | "systemControl";

// New interfaces for workflow management
export interface Workflow {
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
