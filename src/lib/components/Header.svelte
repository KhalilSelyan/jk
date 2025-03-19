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
	import { settings } from "@/states/settings.svelte";
	import { getCurrentWindow } from "@tauri-apps/api/window";
	import { ChevronDown } from "lucide-svelte";

	$effect(() => {
		document.getElementById("titlebar")?.addEventListener("mousedown", async (e) => {
			settings.setIsGettingDragged(true);
			if (e.buttons === 1) {
				if (e.detail === 2) {
					await getCurrentWindow().toggleMaximize();
				} else {
					await getCurrentWindow().startDragging();
				}
			}
		});

		document.getElementById("titlebar")?.addEventListener("mouseup", () => {
			settings.setIsGettingDragged(false);
		});

		return () => {
			document.getElementById("titlebar")?.removeEventListener("mousedown", async (e) => {
				if (e.buttons === 1) {
					if (e.detail === 2) {
						await getCurrentWindow().toggleMaximize();
					} else {
						await getCurrentWindow().startDragging();
					}
				}
			});

			document.getElementById("titlebar")?.removeEventListener("mouseup", () => {
				settings.setIsGettingDragged(false);
			});
		};
	});

	const availableRoutes = routes.filter((link) => !link.includes("passcode"));
</script>

<div
	role="none"
	id="titlebar"
	class="flex w-full items-center justify-end gap-4 border-b border-border bg-card px-4"
>
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
						<Button variant="ghost" href={route(link)} class="capitalize text-foreground">
							{link === "/" ? "home" : link.split("/")[1]}
						</Button>
						<DropdownMenuShortcut class="text-muted-foreground">⌘+{idx + 1}</DropdownMenuShortcut>
					</DropdownMenuItem>
				{/each}
			</DropdownMenuContent>
		</DropdownMenu>
		<!-- <ThemeToggler /> -->
	</div>
</div>
