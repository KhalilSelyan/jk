<script lang="ts">
	import { Handle, Position, useNodes } from "@xyflow/svelte";
	import { Lock, UnlockKeyhole } from "lucide-svelte";
	import type { FlowNode, SystemControlNode } from "$lib/types";
	import { buttonConfigs } from "../icons.svelte";

	interface Props {
		id: string;
		data: FlowNode["data"];
	}

	let { id, data }: Props = $props();
	let nodes = useNodes();

	let isThisNodeLocked = $derived(
		nodes.current.find((n) => n.type === "systemControl" && n.id === id)
	) as SystemControlNode;

	const Action = buttonConfigs.quest[2];
</script>

<div class="min-w-[200px] rounded-lg bg-nodes-action p-4 text-nodes-action-foreground shadow-md">
	<Handle type="target" position={Position.Top} />

	<div class="mb-2 flex items-center gap-2">
		<Action.icon class="h-5 w-5" />
		<h3 class="font-medium">{data.title}</h3>
	</div>

	<p class="mb-2 text-sm">{data.description}</p>

	<div class="flex items-center gap-2 text-sm">
		{#if isThisNodeLocked?.data.isLocked}
			<Lock class="h-4 w-4 text-red-600" />
			<span class="text-red-600">Locked</span>
		{:else}
			<UnlockKeyhole class="h-4 w-4" />
			<span>Unlocked</span>
		{/if}
	</div>
</div>
