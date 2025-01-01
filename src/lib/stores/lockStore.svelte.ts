import { derived } from "svelte/store";
import { nodes, edges } from "./flowStore.svelte";

export const systemLock = derived([nodes, edges], ([$nodes, $edges]) => {
	const actionNodes = $nodes.filter((node) => node.type === "action");

	for (const actionNode of actionNodes) {
		// Find all incoming edges to this action
		const incomingEdges = $edges.filter((edge) => edge.target === actionNode.id);

		// Get all source nodes (tasks/triggers) that need to be completed
		const dependencyNodes = incomingEdges
			.map((edge) => $nodes.find((node) => node.id === edge.source))
			.filter(Boolean);

		// Check if all dependencies are validated
		const allDependenciesValidated = dependencyNodes.every((node) => node?.data.validated);

		// If not all dependencies are validated, the system should be locked
		if (!allDependenciesValidated) {
			return {
				isLocked: true,
				reason: `Complete required tasks to unlock ${actionNode.data.title}`,
			};
		}
	}

	return {
		isLocked: false,
		reason: "",
	};
});
