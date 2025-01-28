<script lang="ts">
	import { Handle, Position } from "@xyflow/svelte";
	import { Sun } from "lucide-svelte";
	import type { FlowNode } from "$lib/types";

	export let data: FlowNode["data"];
</script>

<div
	class="text-node-trigger-foreground min-w-[200px] rounded-lg bg-node-trigger p-4 shadow-lg transition-all hover:shadow-xl"
>
	<div class="mb-2 flex items-center gap-2">
		<Sun class="h-5 w-5 text-primary-100" />
		<h3 class="font-medium text-primary-100">{data.title}</h3>
	</div>

	<p class="text-muted-foreground mb-2 text-sm">{data.description}</p>

	<Handle type="target" position={Position.Bottom} class="!border-primary-400 !bg-primary-500" />
</div>
