import { Ollama } from "npm:@langchain/ollama";
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from "npm:@langchain/core/prompts";
import { StateType } from "../schemas/stateSchema.ts";

const llm = new Ollama({
  model: Deno.env.get("OLLAMA_MODEL") as string,
  baseUrl: Deno.env.get("OLLAMA_BASE_URL") as string,
});

export async function medILlamaAgent(state: StateType) {
  const tasks = state.tasks.MedILlama || [];
  const responses = [];

  for (const task of tasks) {
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
        You are a specialized medical AI assistant with deep knowledge of medical terminology, conditions, treatments, and research.
        
        Instructions:
        1. Provide detailed, accurate medical information
        2. Include relevant medical terminology and explain it
        3. Focus on evidence-based information
        4. If discussing treatments, mention both benefits and potential risks
        5. Structure your response clearly with relevant subsections
        6. Be precise and concise while maintaining completeness
        7. If there are multiple aspects to the query, address each one systematically

        Your response will be combined with:
        - Latest research findings from a RAG system
        - Current medical developments from web searches
      `),
      HumanMessagePromptTemplate.fromTemplate("Medical Query: {query}")
    ]);

    const chain = prompt.pipe(llm);
    const response = await chain.invoke({ query: task.query });

    responses.push({
      content: response,
      metadata: { task: task.query }
    });
  }

  return { ...state, medILlamaResponse: responses };
}
