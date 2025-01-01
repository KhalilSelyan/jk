export interface FlowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    title: string;
    description: string;
    icon: string;
    completed: boolean;
    validated: boolean;
    imageProof?: string;
    lockType?: "wifi" | "apps" | "entertainment";
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

export type NodeType = "task" | "trigger" | "action";

export interface SystemLock {
  isLocked: boolean;
  reason: string;
}
