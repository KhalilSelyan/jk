<script lang="ts">
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuShortcut,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import ThemeToggler from "@/components/ThemeToggler.svelte";
	import { Button } from "@/components/ui/button";
	import { route, routes } from "@/ROUTES";
	import { ChevronDown } from "lucide-svelte";
</script>

<div
	data-tauri-drag-region
	class="flex w-full items-center justify-end gap-4 border-b border-border bg-card px-4 py-2"
>
	<div class="flex items-center gap-2">
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Button variant="ghost" class="gap-1 text-foreground hover:bg-primary-200">
					Menu
					<ChevronDown class="text-muted-foreground h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" class="border-border bg-card">
				{#each routes as link, idx}
					<DropdownMenuItem
						class="flex w-full items-center justify-between px-2 py-0 hover:bg-primary-200"
					>
						<Button variant="ghost" href={route(link)} class="capitalize text-foreground">
							{link === "/" ? "home" : link.split("/")[1]}
						</Button>
						<DropdownMenuShortcut class="text-muted-foreground">⌘+{idx + 1}</DropdownMenuShortcut>
					</DropdownMenuItem>
				{/each}
			</DropdownMenuContent>
		</DropdownMenu>
		<ThemeToggler />
	</div>
</div>
