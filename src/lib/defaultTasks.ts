import type { FlowNode } from "./types";

export const defaultTasks: FlowNode[] = [
  {
    id: "1",
    type: "task",
    position: { x: 0, y: 0 },
    data: {
      title: "Wash Face",
      description: "Start your day fresh by washing your face",
      icon: "face",
      completed: false,
      validated: false,
    },
  },
  {
    id: "2",
    type: "task",
    position: { x: 0, y: 0 },
    data: {
      title: "Take Medication",
      description: "Remember to take your daily medication",
      icon: "pill",
      completed: false,
      validated: false,
    },
  },
];
