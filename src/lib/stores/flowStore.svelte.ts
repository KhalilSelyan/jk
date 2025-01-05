import { writable } from "svelte/store";
import type { FlowNode, FlowEdge } from "../types";

export const nodes = writable<FlowNode[]>([]);
export const edges = writable<FlowEdge[]>([]);
