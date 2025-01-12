import { ChatGroq } from "npm:@langchain/groq";
import { StateType } from "../schemas/stateSchema.ts";
import { compileAgentPrompt } from "../utils/prompts.ts";

const llm = new ChatGroq({
  apiKey: Deno.env.get("GROQ_API_KEY") as string,
  model: "llama-3.3-70b-versatile",
  maxRetries: 3,
});

export async function compileAgent(state: StateType) {
  // console.log("\n📚 Compiling Results");
  
  if (!state.medILlamaResponse?.length || !state.webSearchResponse?.length) {
    return state;
  }

  try {
    const chain = compileAgentPrompt.pipe(llm);
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

    // console.log("✨ Compilation Complete");
    return {
      ...state,
      finalResponse: response.content.toString()
    };
  } catch (err: unknown) {
    const error = err as Error;
    // console.error("❌ Compilation failed:", error.message);
    throw error;
  }
}
