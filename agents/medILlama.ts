import { Ollama } from "npm:@langchain/ollama";
import { StateType } from "../schemas/stateSchema.ts";
import { medILlamaPrompt } from "../utils/prompts.ts";

const llm = new Ollama({
  model: Deno.env.get("OLLAMA_MODEL") as string,
  baseUrl: Deno.env.get("OLLAMA_BASE_URL") as string,
});

// Global variable to store the latest medILlama response
export let medILlamaGlobalResponse: string = "";

export async function medILlamaAgent(state: StateType) {
  console.log("\n🏥 MedILlama Agent Started");
  const tasks = state.tasks.MedILlama || [];
  const responses = [];

  // Clear previous response when starting a new run
  medILlamaGlobalResponse = "";

  for (const task of tasks) {
    try {
      // Create the chain
      const chain = medILlamaPrompt.pipe(llm);
      
      // Handle streaming properly by collecting all chunks
      let fullResponse = "";
      
      // Use explicit streaming and collect all chunks
      const stream = await chain.invoke({ query: task.query });
      
      // Process each chunk and accumulate them
      for await (const chunk of stream) {
        if (typeof chunk === "string") {
          fullResponse += chunk;
        } else if (chunk.content) {
          fullResponse += chunk.content;
        } else {
          fullResponse += String(chunk);
        }
      }
      
      // Push the complete response as an object
      responses.push({
        content: fullResponse,
        metadata: { task: task.query }
      });
    } catch (error) {
      responses.push({
        content: "Error processing medical query. Please try again later.",
        metadata: { task: task.query, error: error instanceof Error ? error.message : String(error)}
      });
    }
  }

  // Create a combined response
  const combinedResponse = responses
    .map((r) => `Task: ${r.metadata.task}\nResponse: ${r.content}`)
    .join("\n\n\n-------------------------------------------------------------------------\n\n\n");

  // console.log(combinedResponse);

  // Update global variable with the new response
  medILlamaGlobalResponse = combinedResponse;

  // Return the combined string in medILlamaResponse for compatibility
  return { ...state, medILlamaResponse: combinedResponse };
}
