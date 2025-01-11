import { Ollama } from "npm:@langchain/ollama";
import { StateType } from "../schemas/stateSchema.ts";
import { medILlamaPrompt } from "../utils/prompts.ts";

const llm = new Ollama({
  model: Deno.env.get("OLLAMA_MODEL") as string,
  baseUrl: Deno.env.get("OLLAMA_BASE_URL") as string,
});

export async function medILlamaAgent(state: StateType) {
  const tasks = state.tasks.MedILlama || [];
  const responses = [];

  for (const task of tasks) {
    const chain = medILlamaPrompt.pipe(llm);
    const response = await chain.invoke({ query: task.query });

    responses.push({
      content: response,
      metadata: { task: task.query }
    });
  }

  return { ...state, medILlamaResponse: responses };
}
