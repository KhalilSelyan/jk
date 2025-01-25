<script lang="ts">
	import { useConnection } from "@xyflow/svelte";
	import { mode } from "mode-watcher";

	const connection = useConnection();

	let path: string | null = $derived.by(() => {
		if (connection.current.inProgress) {
			const { from, to } = connection.current;
			return `M${from.x},${from.y} C ${from.x} ${to.y} ${from.x} ${to.y} ${to.x},${to.y}`;
		}
		return null;
	});
</script>

{#if connection.current.inProgress}
	<path
		fill="none"
		stroke-width={2}
		class="animated"
		stroke={$mode === "dark" ? "#fff" : "#000"}
		d={path}
	/>
	<circle
		cx={connection.current.to.x}
		cy={connection.current.to.y}
		fill="#fff"
		r={3}
		stroke={$mode === "dark" ? "#fff" : "#000"}
		stroke-width={2}
	/>
{/if}
