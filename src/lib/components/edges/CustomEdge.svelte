<script lang="ts">
	import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/svelte";

	interface Props {
		id: EdgeProps["id"];
		sourceX: EdgeProps["sourceX"];
		sourceY: EdgeProps["sourceY"];
		sourcePosition: EdgeProps["sourcePosition"];
		targetX: EdgeProps["targetX"];
		targetY: EdgeProps["targetY"];
		targetPosition: EdgeProps["targetPosition"];
		markerEnd?: EdgeProps["markerEnd"];
		style?: EdgeProps["style"];
	}

	let {
		id,
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
		markerEnd = undefined,
		style,
	}: Props = $props();

	let [edgePath, labelX, labelY] = $derived(
		getBezierPath({
			targetX,
			targetY,
			targetPosition,
			sourceX,
			sourceY,
			sourcePosition,
		})
	);
</script>

<BaseEdge
	{id}
	path={edgePath}
	{markerEnd}
	class="stroke-primary-200 stroke-2 transition-all hover:stroke-primary-100"
	{style}
/>
