import { StateType } from "../schemas/stateSchema.ts";
import { queryEvaluationPrompt } from "../utils/prompts.ts";
import { LLM } from "../config.ts";

const llm = LLM || '';

export async function evaluationAgent(state: StateType) {
  
  const chain = queryEvaluationPrompt.pipe(llm);
  const evaluation = await chain.invoke({ userQuery: state.userQuery });
  const response = evaluation.content.toString();

  if (response.startsWith("SIMPLE:")) {
    
    return {
      ...state,
      finalResponse: response.substring(7).trim(),
      isSimpleQuery: true
    };
  }
  
  return {
    ...state,
    isSimpleQuery: false
  };
} 