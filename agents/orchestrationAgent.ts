import { ChatGroq } from "npm:@langchain/groq";
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from "npm:@langchain/core/prompts";
import { DecompositionSchema } from "../model/decompositionSchema.ts";


// Initialize the Groq LLM
const llm = new ChatGroq({
  apiKey: "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",
  model: "llama-3.3-70b-versatile",
  maxRetries: 3,
});

// Define the orchestration function
async function orchestrateQuery(userQuery: string) {
  // Create the prompt template
  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `
      You are an expert in medical research. Your task is to analyze the user's query, assign 
      information-gathering tasks to specialized agents, and orchestrate the workflow. You have access to the following agents:

      MedILlama: A medical fine-tuned LLM for gathering general medical knowledge (e.g., symptoms, side effects, basic mechanisms).

      Web Search Agent: For gathering real-time, up-to-date information (e.g., latest treatments, clinical trials, recent studies).

      RAG Database Search Agent: For retrieving detailed, document-level information (e.g., mechanisms of action, in-depth research papers).

      Assign tasks to the appropriate agents based on the user's query. You can assign multiple tasks to the same agent if necessary.

      Example: 
      {{
        "MedILlama": [
          {{ "query": "What are the common side effects of Levodopa?" }},
          {{ "query": "What are the long-term effects of Levodopa?" }}
        ],
        "Web": [
          {{ "query": "Research on latest treatments for Parkinson's disease" }}
        ],
        "RAG": [
          {{ "query": "Provide detailed information on the mechanism of action of dopamine agonists" }}
        ]
      }}

      IMPORTANT: Use the specific keywords for the agents:
      - MedILlama
      - Web
      - RAG
      `
    ),
    HumanMessagePromptTemplate.fromTemplate(
      "Assign information-gathering tasks to the above agents to answer the user's query: {userQuery}"
    ),
  ]);

  // Create the chain with structured output
  const chain = prompt.pipe(
    llm.withStructuredOutput(DecompositionSchema, {
      name: "OrchestrationOutput",
    })
  );

  // Invoke the chain with the user query
  const response = await chain.invoke({ userQuery });

  // Return the structured output
  return response;
}

// Example usage
(async () => {
  const userQuery = "What are the latest advancements in the treatment of Alzheimer's disease, including the efficacy of monoclonal antibodies like Lecanemab and Donanemab? Additionally, provide a detailed comparison of the side effects of these drugs versus traditional cholinesterase inhibitors like Donepezil. Also, explore the role of amyloid-beta plaques in the progression of Alzheimer's and how current treatments target this mechanism. Finally, are there any ongoing clinical trials investigating novel therapies for early-stage Alzheimer's patients?";
  const tasks = await orchestrateQuery(userQuery);
  console.log("Tasks:", tasks);
})();