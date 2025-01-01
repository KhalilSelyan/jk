<script lang="ts">
	import { User, Pill, CheckCircle2 } from "lucide-svelte";
	import type { FlowNode } from "../types";
	import { tasks } from "../stores/taskStore.svelte";

	export let task: FlowNode;

	const handleImageUpload = async (event: Event) => {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const reader = new FileReader();
			reader.onload = (e) => {
				if (e.target?.result) {
					tasks.validateTask(task.id, e.target.result as string);
				}
			};
			reader.readAsDataURL(input.files[0]);
		}
	};
</script>

<div class="flex items-center gap-4 border-b border-gray-200 py-4">
	<Pill class="h-6 w-6 text-emerald-500" />

	<div class="flex-1">
		<h3 class="font-medium">{task.data.title}</h3>
		<p class="text-sm text-gray-600">{task.data.description}</p>
	</div>

	<div class="flex items-center gap-2">
		{#if !task.data.validated}
			<label
				class="cursor-pointer rounded-md bg-emerald-500 px-3 py-1 text-white hover:bg-emerald-500/90"
			>
				Upload Proof
				<input type="file" accept="image/*" class="hidden" on:change={handleImageUpload} />
			</label>
		{:else}
			<CheckCircle2 class="h-6 w-6 text-secondary" />
		{/if}
	</div>
</div>
