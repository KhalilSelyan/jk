<script lang="ts">
	import { Handle, Position } from "@xyflow/svelte";
	import { Lock, UnlockKeyhole } from "lucide-svelte";
	import type { FlowNode, SystemControlNode } from "../../types";
	import { nodes } from "@/stores/flowStore.svelte";
	import { buttonConfigs } from "../icons.svelte";

	interface Props {
		id: string;
		data: FlowNode["data"];
	}

	let { id, data }: Props = $props();

	let isThisNodeLocked = $derived(
		$nodes.find((n) => n.type === "systemControl" && n.id === id)
	) as SystemControlNode;

	const Action = buttonConfigs.quest[2];
</script>

<div class="bg-nodes-action text-nodes-action-foreground min-w-[200px] rounded-lg p-4 shadow-md">
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
