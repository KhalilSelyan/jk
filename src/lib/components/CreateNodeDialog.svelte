<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Label } from "$lib/components/ui/label";
	import { Input } from "$lib/components/ui/input";
	import { Textarea } from "$lib/components/ui/textarea";
	import type { FlowNode, NodeType } from "../types";
	import { ulid } from "ulid";
	import { innerHeight, innerWidth } from "svelte/reactivity/window";

	interface Props {
		show?: boolean;
		type: NodeType;
		close: () => void;
		create: (node: FlowNode) => void;
	}

	let { show = $bindable(false), type, close, create }: Props = $props();

	let title = $state("");
	let description = $state("");

	function handleSubmit() {
		if (!title || !description) return;

		const baseNodeData = {
			id: ulid(),
			position: { x: (innerWidth.current ?? 500) / 2, y: (innerHeight.current ?? 200) / 2 },
			data: {
				title,
				description,
				icon: getIconForType(type),
			},
		};

		let node: FlowNode;

		switch (type) {
			case "workflowStart":
				node = {
					...baseNodeData,
					type,
					data: {
						...baseNodeData.data,
					},
				};
				break;

			case "verifiableTask":
				node = {
					...baseNodeData,
					type,
					data: {
						...baseNodeData.data,
						completed: false,
						validated: false,
					},
				};
				break;

			case "systemControl":
				node = {
					...baseNodeData,
					type,
					data: {
						...baseNodeData.data,
						lockType: "wifi", // Default to wifi, could be made configurable
						isLocked: true,
					},
				};
				break;

			default:
				throw new Error(`Unsupported node type: ${type}`);
		}

		create(node);
		resetForm();
	}

	function resetForm() {
		title = "";
		description = "";
		close();
	}

	function getIconForType(type: NodeType): string {
		switch (type) {
			case "workflowStart":
				return "sun";
			case "verifiableTask":
				return "list-todo";
			case "systemControl":
				return "wifi";
			default:
				return "circle";
		}
	}
</script>

<Dialog bind:open={show} onOpenChange={resetForm}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Create New {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
		</DialogHeader>

		<form onsubmit={handleSubmit} class="space-y-4">
			<div class="space-y-2">
				<Label for="title">Title</Label>
				<Input type="text" id="title" bind:value={title} placeholder="Enter title" />
			</div>

			<div class="space-y-2">
				<Label for="description">Description</Label>
				<Textarea
					id="description"
					bind:value={description}
					placeholder="Enter description"
					rows={3}
				/>
			</div>

			<div class="flex justify-end gap-2">
				<Button variant="outline" type="button" onclick={resetForm}>Cancel</Button>
				<Button type="submit">Create</Button>
			</div>
		</form>
	</DialogContent>
</Dialog>
