import { Ollama } from "npm:@langchain/ollama";

//command to tunnel ollama to cloudflare (no need to ollama serve): cloudflared tunnel --protocol http2 --url http://localhost:11434 --http-host-header="localhost:11434"

const llm = new Ollama({
  model: "hf.co/DevQuasar/deepseek-ai.DeepSeek-R1-Distill-Qwen-14B-GGUF:Q4_K_M",
  baseUrl: "https://declare-abu-dictionary-solved.trycloudflare.com",
  
});


const response = await llm.invoke("Hello, how are you?");
console.log(response);
