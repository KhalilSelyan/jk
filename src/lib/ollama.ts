export const ollama = {
  chat: async ({ messages, model }: { messages: any[]; model: string }) => {
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model, images, stream: false }),
    });
    return response.json();
  },
};
