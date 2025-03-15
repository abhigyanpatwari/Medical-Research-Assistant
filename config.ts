import { Ollama } from "npm:@langchain/ollama";
import { ChatGroq } from "npm:@langchain/groq";
import { ChatGoogleGenerativeAI } from "npm:@langchain/google-genai";

export const MAX_ITERATIONS = 3;

export const FINETUNED_MODEL = new Ollama(
    {
        model: Deno.env.get("OLLAMA_MODEL") as string,
        baseUrl: Deno.env.get("OLLAMA_BASE_URL") as string,
        maxRetries: 3,
    }
);

export const LLM = new ChatGroq({
    apiKey: Deno.env.get("GROQ_API_KEY") as string,
    model: "llama-3.3-70b-versatile",
});


// export const LLM = new ChatGoogleGenerativeAI({
//     apiKey: Deno.env.get("GOOGLE_API_KEY") as string,
//     model: "gemini-1.5-pro",
//     temperature: 0,
//     maxRetries: 2,
//   });
