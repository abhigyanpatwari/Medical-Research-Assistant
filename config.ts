import { Ollama } from "npm:@langchain/ollama";
import { ChatGroq } from "npm:@langchain/groq";
import { ChatGoogleGenerativeAI } from "npm:@langchain/google-genai";
import { ChatOpenAI } from "npm:@langchain/openai";

export const MAX_ITERATIONS = 3;

// Add bypass flag for reflection agent
export const BYPASS_REFLECTION = true; // Set to true to bypass reflection LLM calls

export const FINETUNED_MODEL = new Ollama(
    {
        model: Deno.env.get("OLLAMA_MODEL") as string,
        baseUrl: Deno.env.get("OLLAMA_BASE_URL") || "http://localhost:11434",
        maxRetries: 3,
    }
);

export const LLM = new ChatGroq({
    apiKey: Deno.env.get("GROQ_API_KEY") as string,
    model: "llama-3.3-70b-versatile",
});

// export const LLM = new ChatOpenAI({
//     apiKey: Deno.env.get("OPENAI_API_KEY") as string,
//     model: "gpt-4",
//     maxRetries: 2,
// });



// export const LLM = new ChatGoogleGenerativeAI({
//     apiKey: Deno.env.get("GOOGLE_API_KEY") as string,
//     model: "gemini-2.0-flash",
//     temperature: 0,
//     maxRetries: 2,
//   });
