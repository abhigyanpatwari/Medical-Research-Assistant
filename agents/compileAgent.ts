import { ChatGroq } from "npm:@langchain/groq";
import { StateType } from "../schemas/stateSchema.ts";
import { compileAgentPrompt } from "../utils/prompts.ts";

const llm = new ChatGroq({
  apiKey: Deno.env.get("GROQ_API_KEY") as string,
  model: "llama-3.3-70b-versatile",
  maxRetries: 3,
});

export async function compileAgent(state: StateType) {
  console.log("\nCompile Agent Status:");
  console.log("- MedILlama responses:", state.medILlamaResponse?.length || 0);
  console.log("- Web Search responses:", state.webSearchResponse?.length || 0);

  if (!state.medILlamaResponse?.length || !state.webSearchResponse?.length) {
    console.log("⏳ Waiting for responses to complete...");
    return state;
  }

  console.log("✅ All responses received, proceeding with compilation...");

  try {
    const chain = compileAgentPrompt.pipe(llm);
    
    // Format the responses
    const medILlamaText = state.medILlamaResponse
      .map(r => `Query: ${r.metadata?.task || 'Unknown'}\nResponse: ${r.content}`)
      .join('\n\n');

    const webSearchText = JSON.stringify(state.webSearchResponse);

    const response = await chain.invoke({
      userQuery: state.userQuery,
      medILlamaResponse: medILlamaText,
      webSearchResponse: webSearchText,
      ragResponse: ""
    });

    console.log("Compilation completed successfully");

    return {
      ...state,
      finalResponse: response.content.toString()
    };

  } catch (error) {
    console.error("Error in compileAgent:", error);
    throw new Error(`Compilation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
