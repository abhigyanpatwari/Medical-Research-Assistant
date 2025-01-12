import { ChatGroq } from "npm:@langchain/groq";
import { StateType } from "../schemas/stateSchema.ts";
import { queryEvaluationPrompt } from "../utils/prompts.ts";

const llm = new ChatGroq({
  apiKey: Deno.env.get("GROQ_API_KEY") as string,
  model: "llama-3.3-70b-versatile",
  maxRetries: 3,
});

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