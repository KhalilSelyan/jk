<script lang="ts">
  import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
  import { Switch } from "$lib/components/ui/switch";
  import { Label } from "$lib/components/ui/label";
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";

  let autostart = $state(false);

  // Initialize autostart state
  async function initAutostart() {
    autostart = await isEnabled();
  }

  // Toggle autostart
  async function toggleAutostart() {
    try {
      if (autostart) {
        await enable();
      } else {
        await disable();
      }
      autostart = await isEnabled();
    } catch (error) {
      console.error("Failed to toggle autostart:", error);
    }
  }

  // Initialize on mount
  initAutostart();
</script>

<Card class="container max-w-xl">
  <CardHeader>
    <CardTitle>Application Settings</CardTitle>
  </CardHeader>
  <CardContent>
    <div class="flex items-center space-x-2">
      <Switch
        id="autostart"
        checked={autostart}
        onCheckedChange={toggleAutostart}
      />
      <Label for="autostart">Launch on system startup</Label>
    </div>
  </CardContent>
</Card>
