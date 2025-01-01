<script lang="ts">
	import { Handle, Position } from "@xyflow/svelte";
	import { Wifi, Lock, UnlockKeyhole } from "lucide-svelte";
	import type { FlowNode } from "../../types";
	import { systemLock } from "@/stores/lockStore.svelte";

	interface Props {
		data: FlowNode["data"];
	}

	let { data }: Props = $props();

	let isLocked = $derived($systemLock.isLocked);
</script>

<div class="min-w-[200px] rounded-lg border-2 border-indigo-500 bg-white p-4 shadow-md">
	<Handle type="target" position={Position.Top} />

	<div class="mb-2 flex items-center gap-2">
		<Wifi class="h-5 w-5 text-indigo-500" />
		<h3 class="font-medium">{data.title}</h3>
	</div>

	<p class="mb-2 text-sm text-gray-600">{data.description}</p>

	<div class="flex items-center gap-2 text-sm">
		{#if isLocked}
			<Lock class="h-4 w-4 text-red-500" />
			<span class="text-red-500">Locked</span>
		{:else}
			<UnlockKeyhole class="h-4 w-4 text-indigo-500" />
			<span class="text-indigo-500">Unlocked</span>
		{/if}
	</div>
</div>
