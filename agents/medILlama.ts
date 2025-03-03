import { Ollama } from "npm:@langchain/ollama";
import { StateType } from "../schemas/stateSchema.ts";
import { medILlamaPrompt } from "../utils/prompts.ts";

const llm = new Ollama({
  model: Deno.env.get("OLLAMA_MODEL") as string,
  baseUrl: Deno.env.get("OLLAMA_BASE_URL") as string,
  
});

export async function medILlamaAgent(state: StateType) {
  console.log("\n🏥 MedILlama Agent Started");
  const tasks = state.tasks.MedILlama || [];
  const responses = [];

  for (const task of tasks) {
    try {
      const chain = medILlamaPrompt.pipe(llm);
      const response: any = await chain.invoke({ query: task.query });
      
      // Ensure the response is stored as a single string:
      let content: string;
      if (Array.isArray(response)) {
        content = response.join('');
      } else if (typeof response === "string") {
        content = response;
      } else {
        content = response.content ? response.content.toString() : response.toString();
      }

      responses.push({
        content,
        metadata: { task: task.query }
      });
    } catch (error) {
      responses.push({
        content: "Error processing medical query. Please try again later.",
        metadata: { task: task.query, error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  // Combine all responses into one string.
  const combinedContent = responses
    .map(r => `Query: ${r.metadata?.task}\n${r.content}`)
    .join("\n\n---\n\n");

  console.log(combinedContent);
  

  console.log(`🏥 MedILlama Agent Completed (${responses.length} responses)`);

  return { ...state, medILlamaResponse: combinedContent };
}
