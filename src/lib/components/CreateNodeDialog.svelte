<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Label } from "$lib/components/ui/label";
	import { Input } from "$lib/components/ui/input";
	import { Textarea } from "$lib/components/ui/textarea";
	import type { FlowNode, NodeType } from "../types";
	import { ulid } from "ulid";

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

		const node: FlowNode = {
			id: ulid(),
			type,
			position: { x: 250, y: 100 },
			data: {
				title,
				description,
				icon: getIconForType(type),
				completed: false,
				validated: false,
			},
		};

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
			case "trigger":
				return "sun";
			case "task":
				return "list-todo";
			case "action":
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
