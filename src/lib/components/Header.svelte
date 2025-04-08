<script lang="ts">
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuShortcut,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import { route, routes } from "$lib/ROUTES";
	import { Button } from "@/components/ui/button";
	import { getSystemLock } from "@/stores/lockStore.svelte";
	import { ChevronDown } from "lucide-svelte";
	import { toast } from "svelte-sonner";
	import { goto } from "$app/navigation";

	const availableRoutes = routes.filter((link) => !link.includes("passcode"));

	function handleRouteClick(link: (typeof routes)[number]) {
		if (link === "/settings") {
			const hasLockedNode = Array.from(getSystemLock().values()).some((isLocked) => isLocked);
			if (!hasLockedNode) {
				goto(route(link));
			} else {
				toast.error("Cannot access settings while tasks are locked");
			}
		} else {
			goto(route(link));
		}
	}
</script>

<div class="flex w-full items-center justify-end gap-4 border-b border-border bg-card px-4">
	<div class="flex items-center gap-2">
		<DropdownMenu>
			<DropdownMenuTrigger class="w-fit">
				<Button size="sm" variant="ghost" class="gap-1 text-foreground hover:bg-transparent">
					Menu
					<ChevronDown class="text-muted-foreground h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" class="border-border bg-card">
				{#each availableRoutes as link, idx}
					<DropdownMenuItem
						class="flex w-full items-center justify-between px-2 py-0 hover:bg-primary-200"
					>
						<Button
							variant="ghost"
							onclick={() => handleRouteClick(link)}
							class="capitalize text-foreground"
						>
							{link === "/" ? "home" : link.split("/")[1]}
						</Button>
						<DropdownMenuShortcut class="text-muted-foreground">⌘+{idx + 1}</DropdownMenuShortcut>
					</DropdownMenuItem>
				{/each}
			</DropdownMenuContent>
		</DropdownMenu>
	</div>
</div>
