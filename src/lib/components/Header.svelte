<script lang="ts">
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import ThemeToggler from "@/components/ThemeToggler.svelte";
	import { Button } from "@/components/ui/button";
	import { route, routes } from "@/ROUTES";
	import { ChevronDown } from "lucide-svelte";
</script>

<div class="flex w-full items-center justify-between gap-4 px-4">
	<Button variant="ghost" href={route("/")}>Home</Button>
	<div class="flex items-center gap-2">
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Button variant="ghost" class="gap-1">
					Menu
					<ChevronDown />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{#each routes.filter((r) => r !== "/") as link}
					<DropdownMenuItem>
						<Button variant="ghost" href={route(link)} class="w-full justify-start">
							{link}
						</Button>
					</DropdownMenuItem>
				{/each}
			</DropdownMenuContent>
		</DropdownMenu>
		<ThemeToggler />
	</div>
</div>
