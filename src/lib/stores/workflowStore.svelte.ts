import { db } from "@/db/database";
import type { FlowNode, FlowEdge, Workflow } from "@/types";
import { nodes, edges } from "./flowStore.svelte";
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

class WorkflowStore {
	workflows = $state<Workflow[]>([]);
	templates = $state<Workflow[]>([]);
	currentWorkflowId = $state<string | undefined>(undefined);

	async init() {
		await this.loadWorkflows();
		await this.loadTemplates();
	}

	async updateNodePosition(nodeId: string, position: { x: number; y: number }) {
		if (!this.currentWorkflowId) return;

		const workflow = await db.workflows.get(this.currentWorkflowId);
		if (workflow) {
			const updatedNodes = workflow.nodes.map((node) =>
				node.id === nodeId ? { ...node, position } : node
			);

			await this.updateWorkflow(this.currentWorkflowId, {
				nodes: updatedNodes,
			});
			nodes.set(updatedNodes);
		}
	}

	async addNode(node: FlowNode) {
		if (!this.currentWorkflowId) {
			// Get current day
			const today = new Date().getDay();
			const dayIndex = today === 0 ? 6 : today - 1;

			// Create a new workflow for today
			const id = await this.saveWorkflow(`${DAYS[dayIndex]} Workflow`, [node], [], dayIndex);
			await this.loadWorkflow(id);
			return;
		}

		const workflow = await db.workflows.get(this.currentWorkflowId);
		if (workflow) {
			const updatedNodes = [...workflow.nodes, node];

			await this.updateWorkflow(this.currentWorkflowId, {
				nodes: updatedNodes,
			});
			nodes.set(updatedNodes);
		}
	}

	async deleteNode(nodeId: string) {
		if (!this.currentWorkflowId) return;

		const workflow = await db.workflows.get(this.currentWorkflowId);
		if (workflow) {
			const updatedNodes = workflow.nodes.filter((node) => node.id !== nodeId);
			const updatedEdges = workflow.edges.filter(
				(edge) => edge.source !== nodeId && edge.target !== nodeId
			);

			await this.updateWorkflow(this.currentWorkflowId, {
				nodes: updatedNodes,
				edges: updatedEdges,
			});

			nodes.set(updatedNodes);
			edges.set(updatedEdges);
		}
	}

	private async loadWorkflows() {
		this.workflows = await db.workflows.filter((w) => !w.isTemplate).toArray();
	}

	private async loadTemplates() {
		this.templates = await db.workflows.filter((w) => w.isTemplate).toArray();
	}

	async saveWorkflow(name: string, nodes: FlowNode[], edges: FlowEdge[], dayOfWeek?: number) {
		// Check if workflow already exists for this day
		const existingWorkflow = await this.getWorkflowForDay(dayOfWeek!);

		if (existingWorkflow) {
			// Update existing workflow
			await this.updateWorkflow(existingWorkflow.id!, {
				nodes,
				edges,
				updatedAt: new Date(),
			});
			return existingWorkflow.id!;
		} else {
			// Create new workflow
			const workflow = {
				name,
				nodes,
				edges,
				isTemplate: false,
				dayOfWeek,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const id = await db.workflows.add(workflow);
			await this.loadWorkflows();
			return id;
		}
	}

	async loadWorkflow(id: string | undefined) {
		if (!id) {
			nodes.set([]);
			edges.set([]);
			this.currentWorkflowId = undefined;
			return;
		}

		const workflow = await db.workflows.get(id);
		if (workflow) {
			nodes.set(workflow.nodes);
			edges.set(workflow.edges);
			this.currentWorkflowId = workflow.id;
		}
	}

	async getWorkflowForDay(dayOfWeek: number) {
		const workflow = this.workflows.find((w) => w.dayOfWeek === dayOfWeek);
		if (workflow) {
			this.currentWorkflowId = workflow.id!;
		} else {
			this.currentWorkflowId = undefined;
		}
		return workflow;
	}

	async saveTemplate(name: string, nodes: FlowNode[], edges: FlowEdge[]) {
		const template = {
			name,
			nodes,
			edges,
			isTemplate: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const id = await db.workflows.add(template);
		await this.loadTemplates();
		return id;
	}

	async applyTemplate(templateId: string, dayOfWeek: number) {
		const template = await db.workflows.get(templateId);
		if (!template) throw new Error("Template not found");

		// Check if workflow exists for this day
		const existingWorkflow = await this.getWorkflowForDay(dayOfWeek);

		if (existingWorkflow) {
			// Update existing workflow with template content
			await this.updateWorkflow(existingWorkflow.id!, {
				nodes: template.nodes,
				edges: template.edges,
				updatedAt: new Date(),
			});
			return existingWorkflow.id!;
		} else {
			// Create new workflow from template
			const workflow = {
				...template,
				id: undefined,
				isTemplate: false,
				dayOfWeek,
				name: `${template.name} (${dayOfWeek})`,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const id = await db.workflows.add(workflow);
			await this.loadWorkflows();
			return id;
		}
	}

	async deleteWorkflow(id: string) {
		await db.workflows.delete(id);
		if (this.currentWorkflowId === id) {
			this.currentWorkflowId = undefined;
			nodes.set([]);
			edges.set([]);
		}
		await this.loadWorkflows();
	}

	async deleteTemplate(id: string) {
		await db.workflows.delete(id);
		await this.loadTemplates();
	}

	async updateWorkflow(id: string | undefined, updates: Partial<Workflow>) {
		if (!id) return;
		await db.workflows.update(id, {
			...updates,
			updatedAt: new Date(),
		});
		await this.loadWorkflows();
	}

	async addEdge(edge: FlowEdge) {
		if (!this.currentWorkflowId) return;

		const workflow = await db.workflows.get(this.currentWorkflowId);
		if (workflow) {
			const updatedEdges = [...workflow.edges, edge];
			await this.updateWorkflow(this.currentWorkflowId, {
				edges: updatedEdges,
			});
			edges.set(updatedEdges);
		}
	}

	async deleteEdge(edgeId: string) {
		if (!this.currentWorkflowId) return;

		const workflow = await db.workflows.get(this.currentWorkflowId);
		if (workflow) {
			const updatedEdges = workflow.edges.filter((edge) => edge.id !== edgeId);
			await this.updateWorkflow(this.currentWorkflowId, {
				edges: updatedEdges,
			});
			edges.set(updatedEdges);
		}
	}

	async validateNode(nodeId: string, imageProof: string) {
		if (!this.currentWorkflowId) return;

		const workflow = await db.workflows.get(this.currentWorkflowId);
		if (workflow) {
			const updatedNodes = workflow.nodes.map((node) =>
				node.id === nodeId && node.type === "verifiableTask"
					? {
							...node,
							data: {
								...node.data,
								validated: true,
								imageProof,
							},
						}
					: node
			);

			await this.updateWorkflow(this.currentWorkflowId, {
				nodes: updatedNodes,
			});
			nodes.set(updatedNodes);
		}
	}
}

export const workflowStore = new WorkflowStore();
