<script lang="ts">
	import { ollama } from "@/ollama";
	import { taskStore } from "@/stores/taskStore.svelte";
	import { Handle, Position } from "@xyflow/svelte";
	import type { VerifiableTaskNode } from "$lib/types";
	import { buttonConfigs } from "../icons.svelte";
	import { Clock } from "lucide-svelte";
	import { cn } from "@/utils";
	import { DAYS } from "@/stores/workflowStore.svelte";
	import { format, parse } from "date-fns";

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

	// Add schedule status helpers
	const activeDays = $derived(
		data.schedule
			? Object.entries(data.schedule.days)
					.filter(([_, isActive]) => isActive)
					.map(([day]) => DAYS[Number(day)].slice(0, 3))
					.join(", ")
			: ""
	);

	const isInSchedule = $derived(() => {
		if (!data.schedule) return true;

		const now = new Date();
		const currentDay = now.getDay();
		const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

		return (
			data.schedule.days[currentDay] &&
			currentTime >= data.schedule.startTime &&
			currentTime <= data.schedule.endTime
		);
	});

	// Format times for display
	const formattedSchedule = $derived(
		data.schedule
			? {
					startTime: format(parse(data.schedule.startTime, "HH:mm", new Date()), "h:mm a"),
					endTime: format(parse(data.schedule.endTime, "HH:mm", new Date()), "h:mm a"),
					days: activeDays,
				}
			: null
	);

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
				console.log("Task validated successfully!");
				// Find the associated system control node and toggle it

				// Force a re-render of the component

				data = { ...data, validated: true };
			} else {
				console.log("Task validation failed - image does not show the required activity");
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

	let Task = buttonConfigs.quest[1];
</script>

<div
	class="text-node-task-foreground min-w-[200px] rounded-lg bg-node-task p-4 shadow-lg transition-all hover:shadow-xl"
>
	<Handle type="source" position={Position.Top} class="!border-primary-400 !bg-primary-500" />

	<div class="mb-2 flex items-center gap-2">
		<Task.icon class="h-5 w-5 text-primary-100" />
		<h3 class="font-medium text-primary-100">{data.title}</h3>
	</div>

	<p class="text-muted-foreground mb-2 text-sm">{data.description}</p>

	{#if data.schedule && formattedSchedule}
		<div class="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
			<Clock
				size={14}
				class={cn({
					"text-accent-foreground": isInSchedule,
					"text-muted-foreground": !isInSchedule,
				})}
			/>
			<span>
				{formattedSchedule.startTime}-{formattedSchedule.endTime} ({formattedSchedule.days})
			</span>
		</div>
	{/if}

	{#if !data.validated}
		<div class="space-y-4">
			<label
				class="cursor-pointer rounded-lg bg-nodes-task-foreground px-4 py-2 text-sm font-semibold text-nodes-task shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if !loading}
					<input
						bind:this={imageInput}
						type="file"
						accept="image/*"
						class="hidden"
						onchange={async (e) => {
							imageFile = e.currentTarget.files?.[0];

							if (canAnalyze) await analyzeImage();
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
		<div class="rounded bg-emerald-500/20 px-2 py-1 text-center text-sm text-nodes-task-foreground">
			Completed
		</div>
	{/if}

	<Handle type="target" position={Position.Bottom} class="!border-primary-400 !bg-primary-500" />
</div>
