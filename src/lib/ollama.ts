import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

const BASE_URL = "http://localhost:11434";

export const DEFAULT_MODEL = "llava:7b";

export const ollama = {
	chat: async ({ messages, model = DEFAULT_MODEL }: { messages: any[]; model?: string }) => {
		const response = await ("__TAURI_INTERNALS__" in window ? tauriFetch : fetch)(
			`${BASE_URL}/api/chat`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					// Setting Origin to empty string will make the plugin remove it completely
					Origin: "",
				},
				body: JSON.stringify({ messages, model }),
			}
		);
		return response.json();
	},

	generate: async ({
		prompt,
		model = DEFAULT_MODEL,
		images,
		temperature = 0.7,
		maxTokens,
		topP,
	}: {
		prompt: string;
		model?: string;
		images?: any;
		temperature?: number;
		maxTokens?: number;
		topP?: number;
	}) => {
		try {
			const response = await ("__TAURI__INTERNALS__" in window ? tauriFetch : fetch)(
				`${BASE_URL}/api/generate`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						// Setting Origin to empty string will make the plugin remove it completely
						Origin: "",
					},
					body: JSON.stringify({
						system:
							"You are a picture validator. You are given a task title and description and an image. You need to determine if the image is validating the task. Answers should be concise and to the point and include a yes or no.",
						prompt,
						model,
						images,
						stream: false,
						temperature,
						max_tokens: maxTokens,
						top_p: topP,
					}),
				}
			);
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
