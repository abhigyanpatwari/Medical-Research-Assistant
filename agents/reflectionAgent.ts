import { Ollama } from "npm:@langchain/ollama";
import { StateType } from "../schemas/stateSchema.ts";
import { reflectionPrompt } from "../utils/prompts.ts";

const llm = new Ollama({
  model: Deno.env.get("OLLAMA_MODEL") as string,
  baseUrl: Deno.env.get("OLLAMA_BASE_URL") as string,
});

export async function reflectionAgent(state: StateType) {
  if (!state.finalResponse) {
    return state;
  }

  try {
    const chain = reflectionPrompt.pipe(llm);
    const iterationCount = (state.iterationCount || 0) + 1;

    if (iterationCount > 3) {
      return state;
    }

    const response: any = await chain.invoke({
      userQuery: state.userQuery,
      finalResponse: state.finalResponse
    });

    const result = typeof response === 'string' ? response : response.content?.toString() || response.toString();
    
    const needsImprovement = result.trim().startsWith("FEEDBACK:") || result.includes("FAIL");
    
    return {
      ...state,
      reflectionFeedback: needsImprovement ? result.substring(9).trim() : null,
      qualityPassed: !needsImprovement,
      iterationCount
    };

  } catch (err: unknown) {
    const error = err as Error;
    console.error("❌ Reflection failed:", error.message);
    throw error;
  }
}
