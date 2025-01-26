<script lang="ts">
	import { Label } from "$lib/components/ui/label";
	import TimeInput from "$lib/components/ui/time-input.svelte";
	import { DAYS } from "@/stores/workflowStore.svelte";
	import { Checkbox } from "./checkbox";

	let {
		startTime = $bindable("09:00"),
		endTime = $bindable("17:00"),
		selectedDays = $bindable<Record<number, boolean>>({}),
	} = $props();

	function toggleDay(index: number) {
		selectedDays = {
			...selectedDays,
			[index]: !selectedDays[index],
		};
	}
</script>

<div class="grid gap-4">
	<div class="flex gap-4">
		<div class="flex-1">
			<Label for="startTime">Start Time</Label>
			<TimeInput id="startTime" bind:value={startTime} />
		</div>
		<div class="flex-1">
			<Label for="endTime">End Time</Label>
			<TimeInput id="endTime" bind:value={endTime} />
		</div>
	</div>

	<div class="grid gap-2">
		<Label>Active Days</Label>
		<div class="flex flex-wrap gap-2">
			{#each DAYS as day, index}
				<div class="flex items-center gap-2">
					<Checkbox
						id={`day-${index}`}
						checked={selectedDays[index] ?? false}
						onCheckedChange={() => toggleDay(index)}
					/>
					<Label for={`day-${index}`}>{day}</Label>
				</div>
			{/each}
		</div>
	</div>
</div>
