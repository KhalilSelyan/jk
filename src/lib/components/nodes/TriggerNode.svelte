<script lang="ts">
	import { Handle, Position } from "@xyflow/svelte";
	import { Sun } from "lucide-svelte";
	import type { FlowNode } from "$lib/types";

	export let data: FlowNode["data"];
</script>

<div class="min-w-[200px] rounded-lg bg-nodes-trigger p-4 text-nodes-trigger-foreground shadow-md">
	<Handle type="source" position={Position.Bottom} />

	<div class="mb-2 flex items-center gap-2">
		<Sun class="h-5 w-5" />
		<h3 class="font-medium">{data.title}</h3>
	</div>

	<p class="text-sm">{data.description}</p>
</div>
