import type { SystemControlNode, FlowNode } from "../types";
import { flowStore } from "./flowStore.svelte";
import { taskStore } from "./taskStore.svelte";

let systemLock = $derived.by(() => {
	const lockStates = new Map<string, boolean>();

	// Filter for system control nodes specifically
	const systemControlNodes = flowStore.nodes.filter(
		(node): node is SystemControlNode => node.type === "systemControl"
	);

	for (const controlNode of systemControlNodes) {
		// Find all incoming edges to this system control
		const incomingEdges = flowStore.edges.filter((edge) => edge.source === controlNode.id);
		console.log({ incomingEdges });
		// Get all source nodes (tasks/triggers) that need to be completed
		const dependencyNodes = incomingEdges
			.map((edge) => flowStore.nodes.find((node) => node.id === edge.target))
			.filter((node): node is FlowNode => Boolean(node));
		console.log({ dependencyNodes });
		// Check if all dependencies are validated
		const allDependenciesValidated = dependencyNodes.every((node) => {
			if (node.type === "verifiableTask") {
				// If task is validated, it's always valid regardless of schedule
				return (
					node.data.validated || (node.data.schedule ? !taskStore.isTaskInSchedule(node) : false)
				);
			}
			return true;
		});

		// Store the lock state for this control node
		lockStates.set(controlNode.id, !allDependenciesValidated);
	}

	return lockStates;
});

export const getSystemLock = () => systemLock;
