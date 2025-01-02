<script lang="ts">
	import { Switch } from "$lib/components/ui/switch";
	import { Label } from "$lib/components/ui/label";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { settings } from "$lib/states/settings.svelte";
</script>

<Card class="container max-w-xl">
	<CardHeader>
		<CardTitle>Application Settings</CardTitle>
	</CardHeader>
	<CardContent class="flex flex-col gap-2">
		<div class="flex items-center space-x-2">
			<Switch
				id="autostart"
				checked={settings.isAutostartEnabled}
				onCheckedChange={() => settings.toggleAutostart()}
			/>
			<Label for="autostart">Launch on system startup</Label>
		</div>
		<div class="flex items-center space-x-2">
			<Switch
				id="always-on-top"
				checked={settings.isAlwaysOnTop}
				onCheckedChange={(checked) => settings.toggleAlwaysOnTop(checked)}
			/>
			<Label for="always-on-top">Set Always On Top</Label>
		</div>
	</CardContent>
</Card>
