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

<div
  class="bg-white p-4 rounded-lg shadow-md border-2 border-indigo-500 min-w-[200px]"
>
  <Handle type="target" position={Position.Top} />

  <div class="flex items-center gap-2 mb-2">
    <Wifi class="w-5 h-5 text-indigo-500" />
    <h3 class="font-medium">{data.title}</h3>
  </div>

  <p class="text-sm text-gray-600 mb-2">{data.description}</p>

  <div class="flex items-center gap-2 text-sm">
    {#if isLocked}
      <Lock class="w-4 h-4 text-red-500" />
      <span class="text-red-500">Locked</span>
    {:else}
      <UnlockKeyhole class="w-4 h-4 text-indigo-500" />
      <span class="text-indigo-500">Unlocked</span>
    {/if}
  </div>
</div>
