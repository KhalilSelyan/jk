import { writable } from "svelte/store";
import type { FlowNode } from "../types";
import { defaultTasks } from "../defaultTasks";

const createTaskStore = () => {
	const { subscribe, set, update } = writable<FlowNode[]>(defaultTasks);

	return {
		subscribe,
		toggleComplete: (id: string) =>
			update((tasks) =>
				tasks.map((task) => (task.id === id ? { ...task, completed: !task.data.completed } : task))
			),
		validateTask: (id: string, imageProof: string) =>
			update((tasks) =>
				tasks.map((task) => (task.id === id ? { ...task, validated: true, imageProof } : task))
			),
		reorderTasks: (newOrder: FlowNode[]) => set(newOrder),
	};
};

export const tasks = createTaskStore();
