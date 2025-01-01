<script lang="ts">
  import "../app.css";
  let { children } = $props();
</script>

<main class="bg-foreground text-background">
  {@render children()}
</main>
