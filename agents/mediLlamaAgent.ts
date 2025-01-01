import { ChatGroq } from "npm:@langchain/groq";
import { ChatPromptTemplate } from "npm:@langchain/core/prompts";
import { StateType } from "../utils/state.ts";

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
});

export async function medILlamaAgent(state: StateType) {
  const tasks = state.tasks.MedILlama || [];
  const responses = [];

  for (const task of tasks) {
    const prompt = ChatPromptTemplate.fromTemplate(
      `You are a medical expert. Answer the following medical query: {query}`
    );

    const chain = prompt.pipe(llm);
    const response = await chain.invoke({ query: task.query });

    responses.push({
      content: response.content,
      metadata: { task: task.query }
    });
  }

  return { ...state, medILlamaResponse: responses };
}
