import { isWithinInterval } from "date-fns";
// taskStore.svelte.ts
import { settings } from "$lib/states/settings.svelte";
import { parse } from "date-fns";
import type { FlowEdge, FlowNode, SystemControlNode, VerifiableTaskNode } from "../types";
import { flowStore } from "./flowStore.svelte";
import { workflowStore } from "./workflowStore.svelte";

class TaskStore {
	tasks = $state<FlowNode[]>([]);
	private timerInterval: NodeJS.Timeout | undefined;
	// Add this method to sync with nodes store

	// Add initialization method

	async init() {
		console.log("Initializing TaskStore");
		this.syncWithNodes();

		// Make sure nodes are loaded before starting the checker
		if (this.tasks.length > 0) {
			console.log(`Found ${this.tasks.length} tasks, starting schedule checker`);
			this.startScheduleChecker();
		} else {
			console.log("No tasks found, waiting for tasks to load");

			// Wait for tasks to be loaded and then start the checker
			const checkInterval = setInterval(() => {
				this.syncWithNodes();
				if (this.tasks.length > 0) {
					console.log(`Found ${this.tasks.length} tasks, starting schedule checker`);
					clearInterval(checkInterval);
					this.startScheduleChecker();
				}
			}, 1000);
		}
	}
	syncWithNodes() {
		this.tasks = flowStore.nodes;
	}

	private getConnectedSystemControls(taskId: string): SystemControlNode[] {
		// Get edges where the source is the task and the target is a system control
		const connectedEdges = flowStore.edgess.filter((edge) => edge.target === taskId);

		// Find system control nodes that are targets of these edges
		return this.tasks.filter(
			(node): node is SystemControlNode =>
				node.type === "systemControl" && connectedEdges.some((edge) => edge.source === node.id)
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

			// Get all controls that this task is connected to
			// These are controls where this task is a source and the control is the target
			const connectedControls = this.tasks.filter(
				(node): node is SystemControlNode =>
					node.type === "systemControl" &&
					flowStore.edgess.some((edge) => edge.source === id && edge.target === node.id)
			);

			console.log(`Task ${task.data.title} is connected to ${connectedControls.length} controls`);

			// Process each connected control
			for (const control of connectedControls) {
				try {
					// Get all tasks connected to this control
					const tasksForControl = this.getTasksConnectedToControl(control.id);

					// Check if any of the connected tasks need locking
					let shouldBeLocked = false;

					for (const connectedTask of tasksForControl) {
						// Skip the task we just validated
						if (connectedTask.id === id) continue;

						const inSchedule = connectedTask.data.schedule
							? this.isTaskInSchedule(connectedTask)
							: false;
						if (!connectedTask.data.validated && inSchedule) {
							shouldBeLocked = true;
							break;
						}
					}

					console.log(
						`After validation, control ${control.id} should be ${shouldBeLocked ? "LOCKED" : "UNLOCKED"}`
					);

					// Only update if the lock state needs to change
					if (control.data.isLocked !== shouldBeLocked) {
						// Create safe control object
						const safeControl = JSON.parse(
							JSON.stringify({
								...control,
								data: {
									...control.data,
									isLocked: shouldBeLocked,
								},
							})
						);

						// Update system settings
						settings.toggleLockFocus(shouldBeLocked);
						settings.toggleAlwaysOnTop(shouldBeLocked);

						// Update database
						await workflowStore.updateNode(control.id, safeControl);

						// Update flowStore
						const updatedNodes = flowStore.nodess.map((node) =>
							node.id === control.id
								? {
										...control,
										data: {
											...control.data,
											isLocked: shouldBeLocked,
										},
									}
								: node
						);
						flowStore.setNodes(updatedNodes);
					}
				} catch (error) {
					console.error(`Failed to update control ${control.id} after validation:`, error);
				}
			}
		} catch (error) {
			console.error("Failed to validate task:", error);
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
		if (!task.data.schedule.days[currentDay]) {
			console.log(`Task ${task.data.title} not in schedule: day ${currentDay} not scheduled`);
			return false;
		}

		// Parse schedule times and set them to today's date for comparison
		const startTime = parse(task.data.schedule.startTime, "HH:mm", now);
		const endTime = parse(task.data.schedule.endTime, "HH:mm", now);

		// Log time comparison details
		console.log(`Schedule check for task ${task.data.title}:`, {
			now: now.toLocaleTimeString(),
			startTime: startTime.toLocaleTimeString(),
			endTime: endTime.toLocaleTimeString(),
			day: currentDay,
			scheduledDays: task.data.schedule.days,
		});

		// Check if current time is within the interval
		const isTaskInSchedule = isWithinInterval(now, { start: startTime, end: endTime });
		console.log(`Task ${task.data.title} is ${isTaskInSchedule ? "IN" : "NOT IN"} schedule`);
		return isTaskInSchedule;
	}

	private startScheduleChecker() {
		if (this.timerInterval) return;

		console.log("Starting schedule checker");

		// Check immediately on start
		setTimeout(() => {
			console.log("Initial schedule check");
			this.updateSystemControlsBasedOnSchedule();
		}, 1000);

		// Then set up interval
		this.timerInterval = setInterval(() => {
			console.log("Interval schedule check");
			this.updateSystemControlsBasedOnSchedule();
		}, 10000); // Check every 10 seconds for debugging
	}

	private updateSystemControlsBasedOnSchedule() {
		// First, collect all system control nodes
		const systemControls = this.tasks.filter(
			(node): node is SystemControlNode => node.type === "systemControl"
		);

		console.log({ systemControls });

		// Process each system control
		for (const control of systemControls) {
			try {
				// Find all tasks connected to this control (tasks that should trigger this control)
				const connectedTasks = this.getTasksConnectedToControl(control.id);
				console.log({ connectedTasks });

				// If no tasks are connected, skip this control
				if (connectedTasks.length === 0) {
					console.log(`No tasks connected to control ${control.id}, skipping`);
					continue;
				}

				// Log the connected tasks
				console.log(
					`Control ${control.id} has ${connectedTasks.length} connected tasks:`,
					connectedTasks.map((t) => ({ id: t.id, title: t.data.title }))
				);

				// A control should be locked if ANY of its connected tasks are:
				// 1. Not validated AND
				// 2. Currently in their schedule period
				let shouldBeLocked = false;

				for (const task of connectedTasks) {
					const inSchedule = task.data.schedule ? this.isTaskInSchedule(task) : false;
					const needsLocking = !task.data.validated && inSchedule;

					console.log(`Task ${task.data.title} assessment:`, {
						validated: task.data.validated,
						inSchedule,
						needsLocking,
					});

					// If any task requires locking, the control should be locked
					if (needsLocking) {
						shouldBeLocked = true;
						break;
					}
				}

				console.log(`Control ${control.id} should be ${shouldBeLocked ? "LOCKED" : "UNLOCKED"}`);

				// Only update if the lock state needs to change
				if (control.data.isLocked !== shouldBeLocked) {
					console.log(
						`Updating control ${control.id} from ${control.data.isLocked} to ${shouldBeLocked}`
					);

					// Create a safe copy for DB update
					const safeControl = JSON.parse(
						JSON.stringify({
							...control,
							data: {
								...control.data,
								isLocked: shouldBeLocked,
							},
						})
					);

					// Update system settings
					settings.toggleLockFocus(shouldBeLocked);
					settings.toggleAlwaysOnTop(shouldBeLocked);

					// Update in database
					workflowStore.updateNode(control.id, safeControl);

					// Update in flowStore
					const updatedNodes = flowStore.nodess.map((node) =>
						node.id === control.id
							? {
									...control,
									data: {
										...control.data,
										isLocked: shouldBeLocked,
									},
								}
							: node
					);
					flowStore.setNodes(updatedNodes);
				} else {
					console.log(
						`Control ${control.id} already in correct state (${shouldBeLocked ? "locked" : "unlocked"})`
					);
				}
			} catch (error) {
				console.error(`Failed to process control ${control.id}:`, error);
			}
		}
	}

	// Helper method to get all tasks connected to a control
	private getTasksConnectedToControl(controlId: string): VerifiableTaskNode[] {
		// Get all edges where the control is the target
		const incomingEdges = flowStore.edgess.filter((edge) => edge.source === controlId);

		// Get all tasks that are sources of these edges
		return this.tasks.filter(
			(node): node is VerifiableTaskNode =>
				node.type === "verifiableTask" && incomingEdges.some((edge) => edge.target === node.id)
		);
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
