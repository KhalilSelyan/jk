<script lang="ts">
  import type { FlowNode, NodeType } from "../types";
  import { ulid } from "ulid";
  interface Props {
    show?: boolean;
    type: NodeType;
    close: () => void;
    create: (node: FlowNode) => void;
  }

  let { show = $bindable(false), type, close, create }: Props = $props();

  let title = $state("");
  let description = $state("");

  function handleSubmit() {
    if (!title || !description) return;

    const node: FlowNode = {
      id: ulid(),
      type,
      position: { x: 250, y: 100 },
      data: {
        title,
        description,
        icon: getIconForType(type),
        completed: false,
        validated: false,
      },
    };

    create(node);
    resetForm();
  }

  function resetForm() {
    title = "";
    description = "";
    close();
  }

  function getIconForType(type: NodeType): string {
    switch (type) {
      case "trigger":
        return "sun";
      case "task":
        return "list-todo";
      case "action":
        return "wifi";
      default:
        return "circle";
    }
  }
</script>

{#if show}
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center text-foreground"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-md">
      <h2 class="text-xl font-semibold mb-4"
        >Create New {type.charAt(0).toUpperCase() + type.slice(1)}</h2
      >

      <form onsubmit={handleSubmit} class="space-y-4">
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700"
            >Title</label
          >
          <input
            type="text"
            id="title"
            bind:value={title}
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500/20"
            placeholder="Enter title"
          />
        </div>

        <div>
          <label
            for="description"
            class="block text-sm font-medium text-gray-700">Description</label
          >
          <textarea
            id="description"
            bind:value={description}
            rows="3"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500/20"
            placeholder="Enter description"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            onclick={resetForm}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-white bg-emerald-500 rounded-md hover:bg-emerald-500/90"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
