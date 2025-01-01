<script lang="ts">
  import { Handle, Position } from "@xyflow/svelte";
  import { Sun } from "lucide-svelte";
  import type { FlowNode } from "../../types";

  export let data: FlowNode["data"];
</script>

<div
  class="bg-white p-4 rounded-lg shadow-md border-2 border-amber-500 min-w-[200px]"
>
  <Handle type="source" position={Position.Bottom} />

  <div class="flex items-center gap-2 mb-2">
    <Sun class="w-5 h-5 text-amber-500" />
    <h3 class="font-medium text-background">{data.title}</h3>
  </div>

  <p class="text-sm text-gray-600">{data.description}</p>
</div>
