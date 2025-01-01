<script lang="ts">
  import { Handle, Position } from "@xyflow/svelte";
  import { User } from "lucide-svelte";
  import type { FlowNode } from "../../types";
  import { validateNode } from "../../stores/flowStore.svelte";
  import { ollama } from "@/ollama";

  interface Props {
    data: FlowNode["data"];
  }

  let { data }: Props = $props();

  // State management with runes
  let imageFile = $state<File | undefined>();
  let result = $state("");
  let loading = $state(false);

  // Derived state
  let canAnalyze = $derived(!!imageFile && !loading);

  // Helper function to convert File to base64
  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          resolve(result.split(",")[1]);
        } else {
          reject(new Error("Failed to read file as base64"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function analyzeImage() {
    if (!imageFile) return;

    loading = true;
    const startTime = performance.now();

    try {
      const base64Image = await fileToBase64(imageFile);

      const res = await ollama.generate({
        model: "llava",
        prompt:
          "Is this person brushing their teeth? only answer with yes or no",
        images: [base64Image],
      });

      console.log(res);

      result = res.response;

      if (result.toLowerCase().includes("yes")) {
        validateNode(data.title, base64Image);
      }
    } catch (error) {
      console.error("Error:", error);
      result = "Error analyzing image";
    } finally {
      loading = false;
      console.log(`Analysis took ${performance.now() - startTime}ms`);
    }
  }
</script>

<div
  class="bg-white p-4 rounded-lg shadow-md border-2 border-emerald-500 min-w-[200px]"
>
  <Handle type="target" position={Position.Top} />

  <div class="flex items-center gap-2 mb-2">
    <User class="w-5 h-5 text-emerald-500" />
    <h3 class="font-medium text-background">{data.title}</h3>
  </div>

  <p class="text-sm text-gray-600 mb-2">{data.description}</p>

  {#if !data.validated}
    <div class="space-y-4">
      <label
        class="px-4 py-2 font-semibold text-sm cursor-pointer bg-violet-500 text-white rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <input
          type="file"
          accept="image/*"
          class="hidden"
          onchange={(e) => {
            imageFile = e.currentTarget.files?.[0];

            if (canAnalyze) analyzeImage();
          }}
        />
        Upload Proof
      </label>

      {#if loading}
        <div class="animate-pulse text-gray-600">Analyzing image...</div>
      {/if}

      {#if result}
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="font-semibold mb-2">Analysis Result:</h3>
          <p class="text-gray-700">{result}</p>
        </div>
      {/if}
    </div>
  {:else}
    <div
      class="bg-indigo-500/20 text-indigo-500 px-2 py-1 rounded text-sm text-center"
    >
      Completed
    </div>
  {/if}

  <Handle type="source" position={Position.Bottom} />
</div>
