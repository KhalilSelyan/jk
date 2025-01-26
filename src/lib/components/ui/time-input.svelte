<script lang="ts">
	import { Input } from "./input";
	import { cn } from "@/utils";

	// let value = $state("00:00");
	let {
		id,
		class: class_name,
		value = $bindable(),
	} = $props<{ id?: string; class?: string; value: string }>();

	function handleTimeChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const timeValue = input.value;

		// Ensure the time is in HH:mm format
		if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeValue)) {
			// Format to ensure HH:mm (add leading zeros if needed)
			const [hours, minutes] = timeValue.split(":");
			value = `${hours.padStart(2, "0")}:${minutes}`;
		}
	}
</script>

<Input {id} type="time" {value} oninput={handleTimeChange} class={cn("w-[120px]", class_name)} />
