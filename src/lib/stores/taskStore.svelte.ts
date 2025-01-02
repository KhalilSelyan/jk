import type { FlowNode } from "../types";

class TaskStore {
	tasks = $state<FlowNode[]>([]);

	toggleComplete(id: string) {
		this.tasks = this.tasks.map((task) =>
			task.type === "verifiableTask" && task.id === id
				? { ...task, completed: !task.data.completed }
				: task
		);
	}

	validateTask(id: string, imageProof: string) {
		this.tasks = this.tasks.map((task) =>
			task.id === id ? { ...task, validated: true, imageProof } : task
		);
	}

	reorderTasks(newOrder: FlowNode[]) {
		this.tasks = newOrder;
	}
}

export const taskStore = new TaskStore();
