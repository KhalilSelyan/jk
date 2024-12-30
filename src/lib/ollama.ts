import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

const BASE_URL = "http://localhost:11434";

export const ollama = {
  chat: async ({ messages, model }: { messages: any[]; model: string }) => {
    const response = await ("__TAURI_INTERNALS__" in window
      ? tauriFetch
      : fetch)(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Setting Origin to empty string will make the plugin remove it completely
        Origin: "",
      },
      body: JSON.stringify({ messages, model }),
    });
    return response.json();
  },

  generate: async ({
    prompt,
    model,
    images,
  }: {
    prompt: string;
    model: string;
    images?: any;
  }) => {
    try {
      const response = await ("__TAURI__INTERNALS__" in window
        ? tauriFetch
        : fetch)(`${BASE_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Setting Origin to empty string will make the plugin remove it completely
          Origin: "",
        },
        body: JSON.stringify({ prompt, model, images, stream: false }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Generate error:", error);
      throw error;
    }
  },
};
