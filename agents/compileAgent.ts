import { StateType } from "../schemas/stateSchema.ts";
import { compileAgentPrompt, compileWithoutWebPrompt } from "../utils/prompts.ts";
import { LLM } from "../config.ts";

const llm = LLM || '';

export async function compileAgent(state: StateType) {
  // console.log("\n📚 Compiling Results");
  
  const { requiredAgents } = state;
  
  // Check if we have all required responses
  const hasAllResponses = Object.entries(requiredAgents || {}).every(([agent, required]) => {
    if (!required) return true;
    return agent === 'medILlama' ? state.medILlamaResponse?.length > 0 : 
           agent === 'webSearch' ? state.webSearchResponse?.length > 0 : true;
  });

  if (!hasAllResponses) return state;

  try {
    // Choose prompt based on whether webSearch is required
    const promptTemplate = requiredAgents?.webSearch ? compileAgentPrompt : compileWithoutWebPrompt;
    const chain = promptTemplate.pipe(llm);

    const medILlamaText = requiredAgents?.medILlama ? state.medILlamaResponse
      .map(r => `Query: ${r.metadata?.task || 'Unknown'}\nResponse: ${r.content}`)
      .join('\n\n') : "";
    const webSearchText = requiredAgents?.webSearch ? JSON.stringify(state.webSearchResponse) : "";
    
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
