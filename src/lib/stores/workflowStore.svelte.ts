import { db } from "@/db/database";
import type { FlowEdge, FlowNode, SystemControlNode, VerifiableTaskNode, Workflow } from "@/types";
import { flowStore } from "./flowStore.svelte";
import { taskStore } from "./taskStore.svelte";
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
			flowStore.setNodes(updatedNodes);
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
			flowStore.setNodes(updatedNodes);
		}
	}

	async deleteNode(nodeId: string) {
		if (!this.currentWorkflowId) return;

		const workflow = await db.workflows.get(this.currentWorkflowId);
		if (workflow) {
			const deletedNode = workflow.nodes.find((node) => node.id === nodeId);

			const updatedNodes = workflow.nodes.filter((node) => node.id !== nodeId);

			const updatedEdges = workflow.edges.filter(
				(edge) => edge.source !== nodeId && edge.target !== nodeId
			);

			// If we're deleting a verifiable task, update connected system controls

			if (deletedNode?.type === "verifiableTask") {
				const affectedControls = workflow.edges

					.filter((edge) => edge.source === nodeId)

					.map((edge) =>
						workflow.nodes.find((node) => node.id === edge.target && node.type === "systemControl")
					)

					.filter(Boolean);

				// Update lock states of affected system controls

				const finalNodes = updatedNodes.map((node) => {
					if (affectedControls.some((control) => control?.id === node.id)) {
						const controlEdges = updatedEdges.filter((edge) => edge.target === node.id);

						const remainingSources = controlEdges

							.map((edge) => updatedNodes.find((n) => n.id === edge.source))

							.filter(Boolean);

						const allValidated = remainingSources.every((source) =>
							source && source.type === "verifiableTask" ? source.data.validated : true
						);

						return {
							...node,

							data: {
								...node.data,

								isLocked: !allValidated,
							},
						};
					}

					return node;
				}) as VerifiableTaskNode[];

				await this.updateWorkflow(this.currentWorkflowId, {
					nodes: finalNodes,

					edges: updatedEdges,
				});

				flowStore.setNodes(finalNodes);

				flowStore.setEdges(updatedEdges);

				return;
			}

			await this.updateWorkflow(this.currentWorkflowId, {
				nodes: updatedNodes,

				edges: updatedEdges,
			});

			flowStore.setNodes(updatedNodes);

			flowStore.setEdges(updatedEdges);
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
			flowStore.setNodes([]);
			flowStore.setEdges([]);
			this.currentWorkflowId = undefined;
			return;
		}

		const workflow = await db.workflows.get(id);
		if (workflow) {
			flowStore.setNodes(workflow.nodes);
			flowStore.setEdges(workflow.edges);
			this.currentWorkflowId = workflow.id;

			// Make sure taskStore is synced with the new nodes

			taskStore.syncWithNodes();
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
			flowStore.setNodes([]);
			flowStore.setEdges([]);
		}
		await this.loadWorkflows();
	}

	async deleteTemplate(id: string) {
		await db.workflows.delete(id);
		await this.loadTemplates();
	}

	async updateWorkflow(id: string | undefined, updates: Partial<Workflow>) {
		if (!id) return;

		// Validate that the workflow exists

		const workflow = await db.workflows.get(id);

		if (!workflow) {
			throw new Error("Workflow not found");
		}

		// Validate updates

		if (updates.nodes) {
			// Validate nodes structure

			if (!Array.isArray(updates.nodes)) {
				throw new Error("Invalid nodes structure");
			}
		}

		try {
			await db.transaction("rw", db.workflows, async () => {
				await db.workflows.update(id, {
					...updates,

					updatedAt: new Date(),
				});

				await this.loadWorkflows();
			});
		} catch (error) {
			console.error("Failed to update workflow:", error);

			throw error;
		}
	}

	async addEdge(edge: FlowEdge) {
		if (!this.currentWorkflowId) return;

		const workflow = await db.workflows.get(this.currentWorkflowId);
		if (workflow) {
			const updatedEdges = [...workflow.edges, edge];
			// Check if target node is a system control node

			const targetNode = workflow.nodes.find((node) => node.id === edge.target);

			if (targetNode?.type === "systemControl") {
				// Get all source nodes connected to this system control

				const connectedSources = [
					...updatedEdges
						.filter((e) => e.target === edge.target)

						.map((e) => workflow.nodes.find((n) => n.id === e.source)),
				].filter(Boolean);

				// Check if all dependencies are validated

				const allValidated = connectedSources.every((node) =>
					node?.type === "verifiableTask" ? node.data.validated : true
				);

				// Update the system control node's lock state

				const updatedNodes = workflow.nodes.map((node) =>
					node.id === edge.target && node.type === "systemControl"
						? {
								...node,

								data: {
									...node.data,

									isLocked: !allValidated,
								},
							}
						: node
				);

				await this.updateWorkflow(this.currentWorkflowId, {
					edges: updatedEdges,

					nodes: updatedNodes,
				});

				flowStore.setNodes(updatedNodes);

				flowStore.setEdges(updatedEdges);

				return;
			}

			await this.updateWorkflow(this.currentWorkflowId, {
				edges: updatedEdges,
			});

			flowStore.setEdges(updatedEdges);
		}
	}

	async deleteEdge(edgeId: string) {
		if (!this.currentWorkflowId) return;

		const workflow = await db.workflows.get(this.currentWorkflowId);
		if (workflow) {
			const deletedEdge = workflow.edges.find((edge) => edge.id === edgeId);

			const updatedEdges = workflow.edges.filter((edge) => edge.id !== edgeId);

			// If the deleted edge was connected to a system control node

			if (deletedEdge) {
				const targetNode = workflow.nodes.find((node) => node.id === deletedEdge.target);

				if (targetNode?.type === "systemControl") {
					// Get remaining connected sources after edge deletion

					const remainingConnections = updatedEdges

						.filter((e) => e.target === deletedEdge.target)

						.map((e) => workflow.nodes.find((n) => n.id === e.source))

						.filter(Boolean);

					// If no remaining connections, unlock the system control

					const updatedNodes = workflow.nodes.map((node) =>
						node.id === deletedEdge.target && node.type === "systemControl"
							? {
									...node,

									data: {
										...node.data,

										isLocked: remainingConnections.length > 0,
									},
								}
							: node
					);

					await this.updateWorkflow(this.currentWorkflowId, {
						edges: updatedEdges,

						nodes: updatedNodes,
					});

					flowStore.setNodes(updatedNodes);

					flowStore.setEdges(updatedEdges);

					return;
				}
			}

			await this.updateWorkflow(this.currentWorkflowId, {
				edges: updatedEdges,
			});

			flowStore.setEdges(updatedEdges);
		}
	}

	async validateNode(nodeId: string, imageProof: string) {
		if (!this.currentWorkflowId) return;

		const workflow = await db.workflows.get(this.currentWorkflowId);

		if (!workflow) return;

		// Update the nodes array

		const updatedNodes = workflow.nodes.map((node) => {
			if (node.id === nodeId && node.type === "verifiableTask") {
				return {
					...node,

					data: {
						...node.data,

						validated: true,

						imageProof,
					},
				};
			}

			return node;
		});

		// Update connected system controls

		const connectedEdges = workflow.edges.filter((edge) => edge.source === nodeId);

		for (const edge of connectedEdges) {
			const controlNode = updatedNodes.find(
				(node) => node.id === edge.target && node.type === "systemControl"
			) as SystemControlNode;

			if (controlNode) {
				const incomingEdges = workflow.edges.filter((e) => e.target === controlNode.id);

				const allTasksValidated = incomingEdges.every((e) => {
					const sourceNode = updatedNodes.find((n) => n.id === e.source);

					return sourceNode?.type === "verifiableTask" ? sourceNode.data.validated : true;
				});

				// Update the control node's lock state

				const index = updatedNodes.findIndex((n) => n.id === controlNode.id);

				if (index !== -1) {
					updatedNodes[index] = {
						...controlNode,

						data: {
							...controlNode.data,

							isLocked: !allTasksValidated,
						},
					};
				}
			}
		}

		// Update the workflow in the database

		await db.workflows.update(this.currentWorkflowId, {
			nodes: updatedNodes,

			updatedAt: new Date(),
		});

		// Update the store

		flowStore.setNodes(updatedNodes);
	}
	async updateNode(nodeId: string, updatedNode: FlowNode) {
		if (!this.currentWorkflowId) return;

		const workflow = await db.workflows.get(this.currentWorkflowId);

		if (workflow) {
			const updatedNodes = workflow.nodes.map((node) => (node.id === nodeId ? updatedNode : node));

			await this.updateWorkflow(this.currentWorkflowId, {
				nodes: updatedNodes,
			});

			flowStore.setNodes(updatedNodes);
		}
	}
}

export const workflowStore = new WorkflowStore();
