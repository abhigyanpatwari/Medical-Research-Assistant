import { StateType } from "../schemas/stateSchema.ts";
import { compileAgentPrompt, compileWithoutWebPrompt, compileRefinementPrompt } from "../utils/prompts.ts";
import { LLM } from "../config.ts";
import { medILlamaGlobalResponse } from "./medILlama.ts";

const llm = LLM || '';

export async function compileAgent(state: StateType) {
  const { requiredAgents } = state;
  
  // Verify that all required responses exist
  const hasAllResponses = Object.entries(requiredAgents || {}).every(([agent, required]) => {
    if (!required) return true;
    return agent === 'medILlama'
      ? medILlamaGlobalResponse.length > 0  // Use global variable instead
      : agent === 'webSearch'
      ? state.webSearchResponse?.length > 0
      : true;
  });

  if (!hasAllResponses) return state;

  try {
    let chain, response;
    
    if (state.reflectionFeedback) {
      // Use the refinement prompt when reflection feedback exists
      chain = compileRefinementPrompt.pipe(llm);
      const medILlamaText = requiredAgents?.medILlama ? medILlamaGlobalResponse : "";  // Use global variable
      const webSearchText = requiredAgents?.webSearch ? state.webSearchResponse : "";
      
      response = await chain.invoke({
        previousFinalResponse: state.finalResponse,
        medILlamaResponse: medILlamaText,
        webSearchResponse: webSearchText,
        reflectionFeedback: state.reflectionFeedback
      });
    } else {
      // Choose the prompt based on whether web search is required
      const promptTemplate = requiredAgents?.webSearch ? compileAgentPrompt : compileWithoutWebPrompt;
      chain = promptTemplate.pipe(llm);

      const medILlamaText = requiredAgents?.medILlama ? medILlamaGlobalResponse : "";  // Use global variable
      const webSearchText = requiredAgents?.webSearch ? state.webSearchResponse : "";
      
      response = await chain.invoke({
        userQuery: state.userQuery,
        medILlamaResponse: medILlamaText,
        webSearchResponse: webSearchText,
        ragResponse: ""
      });
    }

    return {
      ...state,
      finalResponse: response.content.toString(),
      medILlamaResponse: state.medILlamaResponse,  // Keep original state update for compatibility
      webSearchResponse: state.webSearchResponse,
    };
  } catch (err: unknown) {
    const error = err as Error;
    throw error;
  }
}
