<script lang="ts">
	import { ollama } from "@/ollama";
	import { Handle, Position } from "@xyflow/svelte";
	import { User } from "lucide-svelte";
	import type { SystemControlNode, VerifiableTaskNode } from "../../types";
	import { taskStore } from "@/stores/taskStore.svelte";
	import { edges, nodes } from "@/stores/flowStore.svelte";

	interface Props {
		id: string;
		data: VerifiableTaskNode["data"];
	}

	let { id, data }: Props = $props();

	// State management with runes
	let imageFile = $state<File | undefined>();
	let imageInput = $state<HTMLInputElement>();
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
				prompt: "Is this person brushing their teeth? only answer with yes or no",
				images: [base64Image],
			});

			console.log(res);

			result = res.response;

			if (result.toLowerCase().includes("yes")) {
				console.log("should validate");
				await taskStore.validateTask(id, base64Image);
			} else {
				// Find the associated system control node and toggle it

				const controlNode = $nodes.find(
					(node): node is SystemControlNode =>
						node.type === "systemControl" &&
						$edges.some((edge) => edge.source === id && edge.target === node.id)
				);

				if (controlNode) {
					taskStore.toggleSystemControl(controlNode.id, true);
				}
			}
		} catch (error) {
			console.error("Error:", error);
			result = "Error analyzing image";
		} finally {
			loading = false;
			if (imageInput) {
				imageInput.value = "";
				imageFile = undefined;
			}
			console.log(`Analysis took ${performance.now() - startTime}ms`);
		}
	}
</script>

<div class="min-w-[200px] rounded-lg border-2 border-emerald-500 bg-white p-4 shadow-md">
	<Handle type="target" position={Position.Top} />

	<div class="mb-2 flex items-center gap-2">
		<User class="h-5 w-5 text-emerald-500" />
		<h3 class="font-medium text-background">{data.title}</h3>
	</div>

	<p class="mb-2 text-sm text-gray-600">{data.description}</p>

	{#if !data.validated}
		<div class="space-y-4">
			<label
				class="cursor-pointer rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if !loading}
					<input
						bind:this={imageInput}
						type="file"
						accept="image/*"
						class="hidden"
						onchange={(e) => {
							imageFile = e.currentTarget.files?.[0];

							if (canAnalyze) analyzeImage();
						}}
					/>
					Upload Proof
				{:else}
					Analyzing...
				{/if}
			</label>

			<!-- {#if result}
				<div class="rounded-lg bg-gray-50 p-4">
					<h3 class="mb-2 font-semibold">Analysis Result:</h3>
					<p class="text-gray-700">{result}</p>
				</div>
			{/if} -->
		</div>
	{:else}
		<div class="rounded bg-indigo-500/20 px-2 py-1 text-center text-sm text-indigo-500">
			Completed
		</div>
	{/if}

	<Handle type="source" position={Position.Bottom} />
</div>
