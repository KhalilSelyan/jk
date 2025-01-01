<script lang="ts">
	import { route, routes } from '@/ROUTES';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';

	import ThemeToggler from '@/components/ThemeToggler.svelte';
	import { Button } from '@/components/ui/button';
	let { children } = $props();
</script>

<ModeWatcher />

<main>
	<div class="flex gap-4">
		{#each routes as link}
			<Button variant="link" href={route(link)}>{link}</Button>
		{/each}
		<ThemeToggler />
	</div>

	{@render children()}
</main>
