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
		completed: boolean;
		validated: boolean;
		imageProof?: string;
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

export interface SystemLock {
	isLocked: boolean;
	reason: string;
}
