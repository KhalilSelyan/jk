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

<div class="flex w-full items-center justify-end gap-4 px-4">
	<div class="flex items-center gap-2">
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Button variant="ghost" class="gap-1">
					Menu
					<ChevronDown />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{#each routes as link, idx}
					<DropdownMenuItem class="flex w-full items-center justify-between px-2 py-0">
						<Button variant="ghost" href={route(link)} class="capitalize">
							{link === "/" ? "home" : link.split("/")[1]}
						</Button>
						<DropdownMenuShortcut>⌘+{idx + 1}</DropdownMenuShortcut>
					</DropdownMenuItem>
				{/each}
			</DropdownMenuContent>
		</DropdownMenu>
		<ThemeToggler />
	</div>
</div>
