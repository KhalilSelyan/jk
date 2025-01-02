import { writable } from "svelte/store";
import type { FlowNode, FlowEdge, VerifiableTaskNode } from "../types";
import { db } from "../db/database";

// Initialize stores
export const nodes = writable<FlowNode[]>([]);
export const edges = writable<FlowEdge[]>([]);

// Load initial data
async function initializeStores() {
	const storedNodes = await db.nodes.toArray();
	const storedEdges = await db.edges.toArray();

	nodes.set(storedNodes);
	edges.set(storedEdges);
}

// Initialize on module load
initializeStores();

export const addNode = async (node: FlowNode) => {
	try {
		await db.nodes.add(node);
		nodes.update((nodes) => [...nodes, node]);
	} catch (error) {
		console.error("Failed to add node:", error);
	}
};

export const validateNode = async (nodeId: string, imageProof?: string) => {
	try {
		const updatedNodes = await db.transaction("rw", db.nodes, async () => {
			const node = await db.nodes.get({ id: nodeId });
			if (node?.type === "verifiableTask") {
				const updatedNode = {
					...node,
					data: {
						...node.data,
						validated: true,
						imageProof,
					},
				} as VerifiableTaskNode;

				await db.nodes.put(updatedNode);
				return updatedNode;
			}
			return node;
		});

		nodes.update((nodes) =>
			nodes.map((node) => {
				if (node.type !== "verifiableTask" || node.id !== nodeId) {
					return node;
				}
				return {
					...node,
					data: {
						...node.data,
						validated: true,
						imageProof,
					},
				} as VerifiableTaskNode;
			})
		);
	} catch (error) {
		console.error("Failed to validate node:", error);
	}
};

export const addEdge = async (edge: FlowEdge) => {
	try {
		await db.edges.add(edge);
		edges.update((edges) => [...edges, edge]);
	} catch (error) {
		console.error("Failed to add edge:", error);
	}
};

// Add new functions for deleting nodes and edges
export const deleteNode = async (nodeId: string) => {
	try {
		await db.nodes.delete(nodeId);
		nodes.update((nodes) => nodes.filter((node) => node.id !== nodeId));
		// Also delete any connected edges
		await db.edges.where("source").equals(nodeId).or("target").equals(nodeId).delete();
		edges.update((edges) =>
			edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
		);
	} catch (error) {
		console.error("Failed to delete node:", error);
	}
};

export const deleteEdge = async (edgeId: string) => {
	try {
		await db.edges.delete(edgeId);
		edges.update((edges) => edges.filter((edge) => edge.id !== edgeId));
	} catch (error) {
		console.error("Failed to delete edge:", error);
	}
};
