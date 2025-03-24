// import { Ollama } from "npm:@langchain/ollama";

// //command to tunnel ollama to cloudflare (no need to ollama serve): cloudflared tunnel --protocol http2 --url http://localhost:11434 --http-host-header="localhost:11434"

// const llm = new Ollama({
//   model: "hf.co/DevQuasar/deepseek-ai.DeepSeek-R1-Distill-Qwen-14B-GGUF:Q4_K_M",
//   baseUrl: "https://declare-abu-dictionary-solved.trycloudflare.com",
  
// });


// const response = await llm.invoke("Hello, how are you?");
// console.log(response);

import { ChatOllama } from "npm:@langchain/ollama";
import { z } from "npm:zod";

// Define the Person schema using zod (TypeScript equivalent of pydantic)
const PersonSchema = z.object({
  name: z.string(),
  age: z.number(),
});

// Define the Person type based on the schema
type Person = z.infer<typeof PersonSchema>;

// Create the ChatOllama model with structured output
const model = new ChatOllama({
  model: Deno.env.get("OLLAMA_MODEL") as string,
  baseUrl: Deno.env.get("OLLAMA_BASE_URL") as string, // Using the same baseUrl as in your original code
}).withStructuredOutput(PersonSchema);

// Invoke the model
const response = await model.invoke("Erick 27");
console.log(response);
