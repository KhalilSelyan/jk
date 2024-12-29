<script lang="ts">
  // Types
  interface OllamaResponse {
    response: string;
  }

  // State management with runes
  let imageFile = $state<File | undefined>();
  let result = $state("");
  let loading = $state(false);

  // Derived state
  let canAnalyze = $derived(!!imageFile && !loading);

  // Helper function to convert File to base64
  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          resolve(result.split(",")[1]);
        } else {
          reject(new Error("Failed to read file as base64"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  // Helper function to process streaming response
  async function processStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
  ): Promise<string> {
    let text = "";
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const json = JSON.parse(line) as OllamaResponse;
            // Only append if response property exists and is a string
            if (json && typeof json.response === "string") {
              text += json.response;
            }
          } catch (parseError) {
            console.warn("Failed to parse JSON line:", line);
            continue; // Skip this line and continue processing
          }
        }
      }
      return text;
    } catch (streamError) {
      console.error("Error processing stream:", streamError);
      throw new Error("Failed to process response stream");
    } finally {
      reader.releaseLock(); // Ensure the reader is properly released
    }
  }

  async function analyzeImage() {
    if (!imageFile) return;

    loading = true;
    const startTime = performance.now();

    try {
      const base64Image = await fileToBase64(imageFile);

      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llava",
          prompt: "Is this person brushing their teeth?",
          images: [base64Image],
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response from Ollama API");
      }

      result = await processStream(response.body.getReader());
    } catch (error) {
      console.error("Error:", error);
      result = "Error analyzing image";
    } finally {
      loading = false;
      console.log(`Analysis took ${performance.now() - startTime}ms`);
    }
  }
</script>

<div class="container mx-auto p-4 max-w-xl">
  <div class="space-y-4">
    <input
      type="file"
      accept="image/*"
      class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
      onchange={(e) => (imageFile = e.currentTarget.files?.[0])}
    />

    <button
      class="px-4 py-2 font-semibold text-sm bg-violet-500 text-white rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      onclick={analyzeImage}
      disabled={!canAnalyze}
    >
      {loading ? "Analyzing..." : "Analyze Image"}
    </button>

    {#if loading}
      <div class="animate-pulse text-gray-600">Analyzing image...</div>
    {/if}

    {#if result}
      <div class="bg-gray-50 p-4 rounded-lg">
        <h3 class="font-semibold mb-2">Analysis Result:</h3>
        <p class="text-gray-700">{result}</p>
      </div>
    {/if}
  </div>
</div>
