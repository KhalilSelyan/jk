import type { SystemControlNode, FlowNode } from "../types";
import { flowStore } from "./flowStore.svelte";
import { taskStore } from "./taskStore.svelte";

let systemLock = $derived.by(() => {
	const lockStates = new Map<string, boolean>();

	// Filter for system control nodes specifically
	const systemControlNodes = flowStore.nodess.filter(
		(node): node is SystemControlNode => node.type === "systemControl"
	);

	for (const controlNode of systemControlNodes) {
		// Find all incoming edges to this system control
		const incomingEdges = flowStore.edgess.filter((edge) => edge.target === controlNode.id);

		// Get all source nodes (tasks/triggers) that need to be completed
		const dependencyNodes = incomingEdges
			.map((edge) => flowStore.nodess.find((node) => node.id === edge.source))
			.filter((node): node is FlowNode => Boolean(node));

		// Check if all dependencies are validated
		const allDependenciesValidated = dependencyNodes.every((node) => {
			if (node.type === "verifiableTask") {
				// If task has a schedule and is within schedule time, check validation status
				// Otherwise consider it validated
				return node.data.schedule && taskStore.isTaskInSchedule(node) ? node.data.validated : true;
			}
			return true;
		});

		// Store the lock state for this control node
		lockStates.set(controlNode.id, !allDependenciesValidated);
	}

	return lockStates;
});

export const getSystemLock = () => systemLock;
