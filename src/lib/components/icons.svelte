<script module lang="ts">
	import {
		Sword,
		Scroll,
		WandSparkles,
		Rocket,
		Target,
		Zap,
		Sparkles,
		Shield,
		Book,
		Map,
	} from "lucide-svelte";

	// Export common icon snippets
	export const icons = {
		// Quest/Adventure themed
		quest: {
			start: Sword,
			task: Scroll,
			action: WandSparkles,
		},
		// basic theme
		basic: {
			trigger: Zap,
			task: Target,
			action: Rocket,
		},
		// Additional categories
		misc: {
			book: Book,
			map: Map,
			shield: Shield,
			sparkles: Sparkles,
		},
	} as const;

	// Export color schemes
	export const colorSchemes = {
		quest: {
			start: "bg-amber-500",
			task: "bg-emerald-500",
			action: "bg-purple-500",
		},
		basic: {
			trigger: "bg-blue-500",
			task: "bg-violet-500",
			action: "bg-indigo-500",
		},
	} as const;

	// Export button configurations
	export const buttonConfigs = {
		quest: [
			{
				type: "workflowStart",
				icon: icons.quest.start,
				label: "Begin Quest",
				color: colorSchemes.quest.start,
			},
			{
				type: "verifiableTask",
				icon: icons.quest.task,
				label: "Mission Log",
				color: colorSchemes.quest.task,
			},
			{
				type: "systemControl",
				icon: icons.quest.action,
				label: "Cast Spell",
				color: colorSchemes.quest.action,
			},
		],
		basic: [
			{
				type: "workflowStart",
				icon: icons.basic.trigger,
				label: "Add Trigger",
				color: colorSchemes.basic.trigger,
			},
			{
				type: "verifiableTask",
				icon: icons.basic.task,
				label: "Add Task",
				color: colorSchemes.basic.task,
			},
			{
				type: "systemControl",
				icon: icons.basic.action,
				label: "Add Action",
				color: colorSchemes.basic.action,
			},
		],
	} as const;
</script>
