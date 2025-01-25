import type { FlowEdge, FlowNode } from "@/types";

export class FlowStore {
	nodes = $state.raw<FlowNode[]>([]);
	edges = $state.raw<FlowEdge[]>([]);

	constructor({
		initialNodes = [],
		initialEdges = [],
	}: {
		initialNodes: FlowNode[];
		initialEdges: FlowEdge[];
	}) {
		this.nodes = initialNodes;
		this.edges = initialEdges;
	}

	// Function to add a new node
	addNode(newNode: FlowNode) {
		this.nodes = [...this.nodes, newNode];
	}

	// Function to remove a node
	removeNode(nodeId: string) {
		this.nodes = this.nodes.filter((node) => node.id !== nodeId);
	}

	// Function to update a single edge by ID
	updateEdge(edgeId: string, newEdgeData: Partial<FlowEdge>) {
		this.edges = this.edges.map((edge) =>
			edge.id === edgeId ? { ...edge, ...newEdgeData } : edge
		);
	}

	// Function to add a new edge
	addEdge(newEdge: FlowEdge) {
		this.edges = [...this.edges, newEdge];
	}

	// Function to remove an edge
	removeEdge(edgeId: string) {
		this.edges = this.edges.filter((edge) => edge.id !== edgeId);
	}

	// Getter function to retrieve current nodes
	get nodess() {
		return this.nodes;
	}

	// Getter function to retrieve current edges
	get edgess() {
		return this.edges;
	}

	// Function to set all nodes (replace entire array)
	setNodes(newNodes: FlowNode[]) {
		this.nodes = newNodes;
	}

	// Function to set all edges (replace entire array)
	setEdges(newEdges: FlowEdge[]) {
		this.edges = newEdges;
	}

	// Reset function to clear all nodes and edges
	reset() {
		this.nodes = [];
		this.edges = [];
	}
}

// Create a single shared instance of the store
export const flowStore = new FlowStore({ initialEdges: [], initialNodes: [] });
