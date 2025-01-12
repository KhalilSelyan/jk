<script lang="ts">
	import { Handle, Position } from "@xyflow/svelte";
	import { Sun } from "lucide-svelte";
	import type { FlowNode } from "../../types";

	export let data: FlowNode["data"];
</script>

<div class="text-nodes-trigger-foreground bg-nodes-trigger min-w-[200px] rounded-lg p-4 shadow-md">
	<Handle type="source" position={Position.Bottom} />

	<div class="mb-2 flex items-center gap-2">
		<Sun class="h-5 w-5" />
		<h3 class="font-medium">{data.title}</h3>
	</div>

	<p class="text-sm">{data.description}</p>
</div>
