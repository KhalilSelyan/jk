<script lang="ts">
	import { settings } from "@/states/settings.svelte";
	import { Handle, Position } from "@xyflow/svelte";
	import { Lock, UnlockKeyhole, Wifi } from "lucide-svelte";
	import type { FlowNode, SystemControlNode } from "../../types";
	import { systemLock } from "@/stores/lockStore.svelte";
	import { workflowStore } from "@/stores/workflowStore.svelte";
	import { nodes } from "@/stores/flowStore.svelte";

	interface Props {
		id: string;
		data: FlowNode["data"];
	}

	let { id, data }: Props = $props();

	let isLocked = $derived($systemLock.get(id) ?? false);

	$inspect($systemLock);

	let isThisNodeLocked = $derived(
		$nodes.find((n) => n.type === "systemControl" && n.id === id)
	) as SystemControlNode;

	$inspect($nodes);
	$inspect(isThisNodeLocked.data.isLocked);
</script>

<div
	class="min-w-[200px] rounded-lg border-2 border-indigo-500 bg-white p-4 text-gray-600 shadow-md"
>
	<Handle type="target" position={Position.Top} />

	<div class="mb-2 flex items-center gap-2">
		<Wifi class="h-5 w-5 text-indigo-500" />
		<h3 class="font-medium">{data.title}</h3>
	</div>

	<p class="mb-2 text-sm">{data.description}</p>

	<div class="flex items-center gap-2 text-sm">
		{#if isThisNodeLocked?.data.isLocked}
			<Lock class="h-4 w-4 text-red-500" />
			<span class="text-red-500">Locked</span>
		{:else}
			<UnlockKeyhole class="h-4 w-4 text-indigo-500" />
			<span class="text-indigo-500">Unlocked</span>
		{/if}
	</div>
</div>
