import { writable } from "svelte/store";
import type { FlowNode, FlowEdge } from "../types";

export const nodes = writable<FlowNode[]>([]);
export const edges = writable<FlowEdge[]>([]);

export const addNode = (node: FlowNode) => {
	nodes.update((nodes) => [...nodes, node]);
};

export const validateNode = (nodeId: string, imageProof?: string) => {
	nodes.update((nodes) =>
		nodes.map((node) =>
			node.data.title === nodeId
				? { ...node, data: { ...node.data, validated: true, imageProof } }
				: node
		)
	);
};

export const addEdge = (edge: FlowEdge) => {
	edges.update((edges) => [...edges, edge]);
};
