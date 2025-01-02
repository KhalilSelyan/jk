import { derived } from "svelte/store";
import { nodes, edges } from "./flowStore.svelte";
import type { SystemControlNode, FlowNode } from "../types";

export const systemLock = derived([nodes, edges], ([$nodes, $edges]) => {
	// Filter for system control nodes specifically
	const systemControlNodes = $nodes.filter(
		(node): node is SystemControlNode => node.type === "systemControl"
	);

	for (const controlNode of systemControlNodes) {
		// Find all incoming edges to this system control
		const incomingEdges = $edges.filter((edge) => edge.target === controlNode.id);

		// Get all source nodes (tasks/triggers) that need to be completed
		const dependencyNodes = incomingEdges
			.map((edge) => $nodes.find((node) => node.id === edge.source))
			.filter((node): node is FlowNode => Boolean(node));

		// Check if all dependencies are validated
		const allDependenciesValidated = dependencyNodes.every((node) =>
			node.type === "verifiableTask" ? node.data.validated : true
		);

		// If not all dependencies are validated, the system should be locked
		if (!allDependenciesValidated) {
			return {
				isLocked: true,
				reason: `Complete required tasks to unlock ${controlNode.data.title}`,
			};
		}
	}

	return {
		isLocked: false,
		reason: "",
	};
});
