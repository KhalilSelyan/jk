<script lang="ts">
	import { DAYS } from "@/stores/workflowStore.svelte";
	import { Clock } from "lucide-svelte";
	import { cn } from "@/utils";

	interface Props {
		schedule?: {
			startTime: string;
			endTime: string;
			days: Record<number, boolean>;
		};
		isActive?: boolean;
	}

	let { schedule, isActive = false }: Props = $props();

	// Get active days as string (e.g., "Mon, Wed, Fri")
	const activeDays = schedule
		? Object.entries(schedule.days)
				.filter(([_, isActive]) => isActive)
				.map(([day]) => DAYS[Number(day)].slice(0, 3))
				.join(", ")
		: "";
</script>

{#if schedule}
	<div class="flex items-center gap-2 text-xs text-muted-foreground">
		<Clock
			size={14}
			class={cn("transition-colors", {
				"text-green-500": isActive,
				"text-muted-foreground": !isActive,
			})}
		/>
		<span>
			{schedule.startTime}-{schedule.endTime} ({activeDays})
		</span>
	</div>
{/if}
