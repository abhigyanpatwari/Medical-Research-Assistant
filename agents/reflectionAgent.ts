import { Ollama } from "npm:@langchain/ollama";
import { StateType } from "../schemas/stateSchema.ts";
import { PromptTemplate } from "npm:@langchain/core/prompts";

const llm = new Ollama({
  model: Deno.env.get("OLLAMA_MODEL") as string,
  baseUrl: Deno.env.get("OLLAMA_BASE_URL") as string,
  verbose: true
});

const reflectionPrompt = PromptTemplate.fromTemplate(`
You are a medical knowledge reflection agent. Review this medical response for accuracy and completeness.
Only provide feedback if there are:
1. Significant medical inaccuracies
2. Important missing information
3. Major knowledge gaps
4. Critical inconsistencies

User Query: {userQuery}
Current Response: {finalResponse}

If improvements are needed, start with "FEEDBACK:" followed by specific, concise suggestions.
If the response is acceptable, respond with "PASS".

Remember: Only suggest changes for significant medical issues. Be concise and direct.
`);

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
