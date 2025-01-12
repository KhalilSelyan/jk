// taskStore.svelte.ts
import { settings } from "$lib/states/settings.svelte";
import type { FlowNode, SystemControlNode, VerifiableTaskNode } from "../types";
import { nodes } from "./flowStore.svelte";
import { workflowStore } from "./workflowStore.svelte";
class TaskStore {
	tasks = $state<FlowNode[]>([]);

	// Add this method to sync with nodes store

	syncWithNodes() {
		// Subscribe to nodes store changes

		nodes.subscribe((currentNodes) => {
			this.tasks = currentNodes;
		});
	}

	// Add initialization method

	init() {
		this.syncWithNodes();
	}

	async validateTask(id: string, imageProof: string) {
		// We use map because we need to return a new array with ALL tasks,

		// where one task is modified but others remain unchanged

		console.log("are we even here at all ?");

		const updatedTasks = [...this.tasks];

		for await (const [index, task] of updatedTasks.entries()) {
			console.log({ task, index });
			if (task.type === "verifiableTask" && task.id === id) {
				const updatedTask = {
					...task,

					data: {
						...task.data,

						validated: true,

						imageProof,
					},
				} as VerifiableTaskNode;

				// Await the database sync

				await workflowStore.validateNode(id, imageProof);

				updatedTasks[index] = updatedTask;

				break; // We found our task, no need to continue the loop
			}
		}

		this.tasks = updatedTasks;
	}

	async toggleSystemControl(id: string, isLocked: boolean) {
		const updatedTasks = [...this.tasks];

		for await (const [index, task] of updatedTasks.entries()) {
			if (task.type === "systemControl" && task.id === id) {
				const updatedTask = {
					...task,

					data: {
						...task.data,

						isLocked,
					},
				} as SystemControlNode;

				settings.toggleLockFocus(isLocked);
				settings.toggleAlwaysOnTop(isLocked);

				// Await the database sync

				await workflowStore.updateNode(id, updatedTask);

				updatedTasks[index] = updatedTask;

				break; // We found our task, no need to continue the loop
			}
		}

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
