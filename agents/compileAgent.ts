import { StateType } from "../schemas/stateSchema.ts";
import { compileAgentPrompt, compileWithoutWebPrompt, compileRefinementPrompt } from "../utils/prompts.ts";
import { LLM } from "../config.ts";

const llm = LLM || '';

export async function compileAgent(state: StateType) {
  const { requiredAgents } = state;
  
  // Verify that all required responses exist (they're now strings).
  const hasAllResponses = Object.entries(requiredAgents || {}).every(([agent, required]) => {
    if (!required) return true;
    return agent === 'medILlama'
      ? state.medILlamaResponse?.length > 0
      : agent === 'webSearch'
      ? state.webSearchResponse?.length > 0
      : true;
  });

  if (!hasAllResponses) return state;

  try {
    let chain, response;
    
    if (state.reflectionFeedback) {
      // Use the refinement prompt when reflection feedback exists.
      chain = compileRefinementPrompt.pipe(llm);
      const medILlamaText = requiredAgents?.medILlama ? state.medILlamaResponse : "";
      const webSearchText = requiredAgents?.webSearch ? state.webSearchResponse : "";
      
      response = await chain.invoke({
        previousFinalResponse: state.finalResponse,
        medILlamaResponse: medILlamaText,
        webSearchResponse: webSearchText,
        reflectionFeedback: state.reflectionFeedback
      });
    } else {
      // Choose the prompt based on whether web search is required.
      const promptTemplate = requiredAgents?.webSearch ? compileAgentPrompt : compileWithoutWebPrompt;
      chain = promptTemplate.pipe(llm);

      const medILlamaText = requiredAgents?.medILlama ? state.medILlamaResponse : "";
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
      finalResponse: response.content.toString()
    };
  } catch (err: unknown) {
    const error = err as Error;
    throw error;
  }
}
