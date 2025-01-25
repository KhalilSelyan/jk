// taskStore.svelte.ts
import { settings } from "$lib/states/settings.svelte";
import type { FlowEdge, FlowNode, SystemControlNode, VerifiableTaskNode } from "../types";
import { flowStore } from "./flowStore.svelte";
import { workflowStore } from "./workflowStore.svelte";

class TaskStore {
	tasks = $state<FlowNode[]>([]);
	private timerInitialized = false;
	// Add this method to sync with nodes store

	// Add initialization method

	async init() {
		this.syncWithNodes();
	}
	syncWithNodes() {
		this.tasks = flowStore.nodess;
	}

	private getConnectedSystemControls(taskId: string): SystemControlNode[] {
		let connectedEdges: FlowEdge[] = [];

		connectedEdges = flowStore.edgess.filter((edge) => edge.source === taskId);

		return this.tasks.filter(
			(node): node is SystemControlNode =>
				node.type === "systemControl" && connectedEdges.some((edge) => edge.target === node.id)
		);
	}

	// Helper to check if all source tasks for a system control are validated

	private areAllSourceTasksValidated(controlId: string): boolean {
		let incomingEdges: FlowEdge[] = [];

		incomingEdges = flowStore.edgess.filter((edge) => edge.target === controlId);

		return incomingEdges.every((edge) => {
			const sourceNode = this.tasks.find((node) => node.id === edge.source);

			return sourceNode?.type === "verifiableTask" ? sourceNode.data.validated : true;
		});
	}

	async validateTask(id: string, imageProof: string) {
		const updatedTasks = [...this.tasks];

		const taskIndex = updatedTasks.findIndex(
			(task) => task.type === "verifiableTask" && task.id === id
		);

		if (taskIndex === -1) return;

		// Update the task validation status

		const updatedTask = {
			...updatedTasks[taskIndex],

			data: {
				...updatedTasks[taskIndex].data,

				validated: true,

				imageProof,
			},
		} as VerifiableTaskNode;

		updatedTasks[taskIndex] = updatedTask;

		// Get all connected system controls

		const connectedControls = this.getConnectedSystemControls(id);

		// Update each connected system control's lock state

		for (const control of connectedControls) {
			const shouldBeLocked = !this.areAllSourceTasksValidated(control.id);

			const controlIndex = updatedTasks.findIndex((task) => task.id === control.id);

			if (controlIndex !== -1) {
				updatedTasks[controlIndex] = {
					...control,

					data: {
						...control.data,

						isLocked: shouldBeLocked,
					},
				} as SystemControlNode;
			}
		}

		// Update database

		await workflowStore.validateNode(id, imageProof);

		// Update local state

		this.tasks = updatedTasks;

		// Update system settings for all controls

		connectedControls.forEach((control) => {
			const isLocked = !this.areAllSourceTasksValidated(control.id);

			settings.toggleLockFocus(isLocked);

			settings.toggleAlwaysOnTop(isLocked);
		});
	}

	async toggleSystemControl(id: string, isLocked: boolean) {
		const updatedTasks = [...this.tasks];

		const controlIndex = updatedTasks.findIndex(
			(task) => task.type === "systemControl" && task.id === id
		);

		if (controlIndex === -1) return;

		const updatedControl = {
			...updatedTasks[controlIndex],

			data: {
				...updatedTasks[controlIndex].data,

				isLocked,
			},
		} as SystemControlNode;

		// Update system settings

		settings.toggleLockFocus(isLocked);

		settings.toggleAlwaysOnTop(isLocked);

		// Update database

		await workflowStore.updateNode(id, updatedControl);

		// Update local state

		updatedTasks[controlIndex] = updatedControl;

		this.tasks = updatedTasks;
	}

	// Helper method to get a specific task
	getTask(id: string): FlowNode | undefined {
		return this.tasks.find((task) => task.id === id);
	}

	// Helper method to check if a verifiable task is validated
	isTaskValidated(id: string): boolean {
		const task = this.getTask(id);
		return task?.type === "verifiableTask" ? task.data.validated : false;
	}

	// Helper method to check if a system control is locked
	isSystemControlLocked(id: string): boolean {
		const task = this.getTask(id);
		return task?.type === "systemControl" ? task.data.isLocked : false;
	}

	reorderTasks(newOrder: FlowNode[]) {
		this.tasks = newOrder;
	}
}

export const taskStore = new TaskStore();
