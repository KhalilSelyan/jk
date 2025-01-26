// taskStore.svelte.ts
import { settings } from "$lib/states/settings.svelte";
import type { FlowEdge, FlowNode, SystemControlNode, VerifiableTaskNode } from "../types";
import { flowStore } from "./flowStore.svelte";
import { workflowStore } from "./workflowStore.svelte";
import { parse, isWithinInterval } from "date-fns";

class TaskStore {
	tasks = $state<FlowNode[]>([]);
	private timerInterval: NodeJS.Timeout | undefined;
	// Add this method to sync with nodes store

	// Add initialization method

	async init() {
		this.syncWithNodes();
		this.startScheduleChecker();
	}
	syncWithNodes() {
		this.tasks = flowStore.nodes;
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
		let incomingEdges = flowStore.edgess.filter((edge) => edge.target === controlId);

		return incomingEdges.every((edge) => {
			const sourceNode = this.tasks.find((node) => node.id === edge.source);

			if (sourceNode?.type === "verifiableTask") {
				return (
					sourceNode.data.validated &&
					(!sourceNode.data.schedule || this.isTaskInSchedule(sourceNode))
				);
			}
			return true;
		});
	}

	async validateTask(id: string, imageProof: string) {
		const task = this.tasks.find(
			(task): task is VerifiableTaskNode => task.type === "verifiableTask" && task.id === id
		);

		if (!task) return;

		if (!this.isTaskInSchedule(task)) {
			console.log("Task cannot be validated outside of scheduled time");
			return;
		}

		const cleanImageProof = imageProof.startsWith("data:") ? imageProof.split(",")[1] : imageProof;

		try {
			// Update database first
			await workflowStore.validateNode(id, cleanImageProof);

			// Sync with latest nodes from flowStore
			this.syncWithNodes();

			// Update connected controls after sync
			const connectedControls = this.getConnectedSystemControls(id);
			for (const control of connectedControls) {
				const shouldBeLocked = !this.areAllSourceTasksValidated(control.id);
				await this.toggleSystemControl(control.id, shouldBeLocked);
			}
		} catch (error) {
			console.error("Failed to validate task:", error);
			throw error;
		}
	}

	async toggleSystemControl(id: string, isLocked: boolean) {
		const control = this.tasks.find(
			(task): task is SystemControlNode => task.type === "systemControl" && task.id === id
		);

		if (!control) return;

		const updatedControl = {
			...control,
			data: {
				...control.data,
				isLocked,
			},
		} as SystemControlNode;

		try {
			// Update system settings
			settings.toggleLockFocus(isLocked);
			settings.toggleAlwaysOnTop(isLocked);

			// Update database
			await workflowStore.updateNode(id, updatedControl);

			// Sync with flowStore
			this.syncWithNodes();
		} catch (error) {
			console.error("Failed to toggle system control:", error);
			throw error;
		}
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

	isTaskInSchedule(task: VerifiableTaskNode): boolean {
		if (!task.data.schedule) return true;

		const now = new Date();
		const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1;

		// First check if the current day is scheduled
		if (!task.data.schedule.days[currentDay]) return false;

		// Parse schedule times and set them to today's date for comparison
		const startTime = parse(task.data.schedule.startTime, "HH:mm", now);
		const endTime = parse(task.data.schedule.endTime, "HH:mm", now);

		// Check if current time is within the interval
		return isWithinInterval(now, { start: startTime, end: endTime });
	}

	private startScheduleChecker() {
		if (this.timerInterval) return;

		// Check immediately on start
		this.updateSystemControlsBasedOnSchedule();

		// Then set up interval
		this.timerInterval = setInterval(() => {
			this.updateSystemControlsBasedOnSchedule();
		}, 30000); // Check every minute
	}

	private updateSystemControlsBasedOnSchedule() {
		const controls = this.tasks
			.filter((task): task is VerifiableTaskNode => task.type === "verifiableTask")
			.flatMap((task) => {
				const connectedControls = this.getConnectedSystemControls(task.id);
				return connectedControls.map((control) => ({
					control,
					task,
				}));
			});

		for (const { control, task } of controls) {
			// For tasks with schedules:
			// - If task is validated, keep unlocked regardless of schedule
			// - If not validated and in schedule, lock
			// - If not validated and outside schedule, unlock
			const shouldBeLock = task.data.validated
				? false
				: task.data.schedule
					? this.isTaskInSchedule(task)
					: true;

			this.toggleSystemControl(control.id, shouldBeLock);
		}
	}

	onDestroy() {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = undefined;
		}
	}

	// When edges are updated
	updateEdges(newEdges: FlowEdge[]) {
		flowStore.edges = newEdges;
		this.updateSystemControlsBasedOnSchedule();
	}
}

export const taskStore = new TaskStore();
