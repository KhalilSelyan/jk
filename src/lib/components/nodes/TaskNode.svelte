<script lang="ts">
	import { ollama } from "@/ollama";
	import { taskStore } from "@/stores/taskStore.svelte";
	import { Handle, Position } from "@xyflow/svelte";
	import type { VerifiableTaskNode } from "$lib/types";
	import { buttonConfigs } from "../icons.svelte";
	import { Clock } from "lucide-svelte";
	import { cn } from "@/utils";
	import { DAYS } from "@/stores/workflowStore.svelte";
	import { format, parse, isWithinInterval } from "date-fns";
	import { toast } from "svelte-sonner";
	import { settings } from "@/states/settings.svelte";

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
		const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1; // Align day indexing with taskStore

		// First check if the current day is scheduled
		if (!data.schedule.days[currentDay]) return false;

		// Parse schedule times and set them to today's date for comparison
		const startTime = parse(data.schedule.startTime, "HH:mm", now);
		const endTime = parse(data.schedule.endTime, "HH:mm", now);

		// Check if current time is within the interval
		return isWithinInterval(now, { start: startTime, end: endTime });
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
				model: "llava:7b",
				prompt: `You are a visual analysis assistant that evaluates images in relation to task requirements.
						\nInstructions:
						\n1. Look for basic visual evidence that matches the task description
						\n2. Accept reasonable partial or in-progress demonstrations of the task
						\n3. Keep validation simple and focused on core task elements
						\n4. MUST INCLUDE either "Done:" or "Failed:" Don't want yes and no
						\n5. Provide a very brief explanation
						\n6. Do not be very strict, accept some variation in the image
						\nExample task:
						\n"Task Title: Brush Teeth\nTask Description: The image should show a person brushing their teeth."
						\nIf the image shows a person holding a toothbrush close to their mouth, this is a valid response.
						\n"Task Title: Wash Clothes or do laundry\nTask Description: Put the dirty clothes in the washing machine."
						\nIf the image shows a person holding dirty clothes with a washing machine in the background, this is a valid response.
									\n
						\nExample responses:
						\n"Done: Image shows the requested action being performed."
						\n"Failed: Image does not show the specified task." 
									\n
						\nTask Title: ${data.title}\nTask Description: ${data.description}`,
				images: [base64Image],
			});

			result = res.response;

			if (result.toLowerCase().includes("done:")) {
				try {
					await taskStore.validateTask(id, base64Image);
					toast.success(result);
					console.log("Task validated successfully!");
					data = { ...data, validated: true };
				} catch (err) {
					console.error("Failed to validate task:", err);
					toast.error("Failed to validate task");
				}
			} else {
				console.log("Task validation failed:", result);
				toast.error("Task validation failed - image does not match requirements");
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
				role=""
				onmousedown={() => settings.setIsPickingFile(true)}
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
							settings.setIsPickingFile(false);
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
