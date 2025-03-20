import { StateType } from "../schemas/stateSchema.ts";
import { medILlamaPrompt } from "../utils/prompts.ts";
import { FINETUNED_MODEL } from "../config.ts";
// import { Ollama } from "npm:@langchain/ollama";

// const llm = new Ollama({
//   model: Deno.env.get("OLLAMA_MODEL") as string,
//   baseUrl: Deno.env.get("OLLAMA_BASE_URL") as string,
// });

const llm = FINETUNED_MODEL;

// Global variable to store the latest medILlama response
export let medILlamaGlobalResponse: string = "";

export async function medILlamaAgent(state: StateType) {
  console.log("\n🏥 MedILlama Agent Started");
  const tasks = state.tasks.MedILlama || [];
  
  // Clear previous response at start
  medILlamaGlobalResponse = "";

  // Combine all task queries into a single string
  const combinedQueries = tasks.map(t => t.query).join("\n\n");

  try {
    const chain = medILlamaPrompt.pipe(llm);
    
    // Use invoke to get the final result (no token-level streaming)
    const result = await chain.invoke({ 
      query: combinedQueries 
    });
    
    // Handle different return types
    let fullResponse = "";
    if (typeof result === "string") {
      fullResponse = result;
    } else if (result && typeof result === "object") {
      // Try to extract content from various possible structures
      if ("content" in result) {
        fullResponse = String(result.content);
      } else if ("text" in result) {
        fullResponse = String(result.text);
      } else {
        fullResponse = String(result);
      }
    } else {
      fullResponse = String(result);
    }

    // Map combined response back to individual tasks format
    const formattedResponse = tasks.map(t => 
      `Task: ${t.query}\nResponse: ${fullResponse}`
    ).join("\n\n------------------------\n\n");

    // Update global and state
    medILlamaGlobalResponse = formattedResponse;
    
    return { 
      ...state,
      medILlamaResponse: String(formattedResponse)
    };

  } catch (error) {
    console.error("MedILlama error:", error.message);
    return {
      ...state,
      medILlamaResponse: "Error processing medical queries: " + error.message
    };
  }
}
