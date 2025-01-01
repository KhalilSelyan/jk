<script lang="ts">
	import { Handle, Position } from "@xyflow/svelte";
	import { Sun } from "lucide-svelte";
	import type { FlowNode } from "../../types";

	export let data: FlowNode["data"];
</script>

<div class="min-w-[200px] rounded-lg border-2 border-amber-500 bg-white p-4 shadow-md">
	<Handle type="source" position={Position.Bottom} />

	<div class="mb-2 flex items-center gap-2">
		<Sun class="h-5 w-5 text-amber-500" />
		<h3 class="font-medium text-background">{data.title}</h3>
	</div>

	<p class="text-sm text-gray-600">{data.description}</p>
</div>
