import { ChatGroq } from "npm:@langchain/groq";
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from "npm:@langchain/core/prompts";
import { DecompositionSchema } from "../schemas/decompositionSchema.ts";
import { WorkflowStateSchema } from "../schemas/workflowSchema.ts";
import { z } from "npm:zod";


const llm = new ChatGroq({
  apiKey: Deno.env.get("GROQ_API_KEY") as string,
  model: "llama-3.3-70b-versatile",
  maxRetries: 3,
});


export async function orchestrateQuery(state: z.infer<typeof WorkflowStateSchema>) {
  const { userQuery } = state;

  
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

  
  const chain = prompt.pipe(
    llm.withStructuredOutput(DecompositionSchema, {
      name: "OrchestrationOutput",
    })
  );

 
  const response = await chain.invoke({ userQuery });
  console.log("Response:", response);

  
  return { ...state, tasks: response.tasks };
}

//test:
// orchestrateQuery({ userQuery: "What are the latest advancements in the treatment of Alzheimer's disease, including the efficacy of monoclonal antibodies like Lecanemab and Donanemab? Additionally, provide a detailed comparison of the side effects of these drugs versus traditional cholinesterase inhibitors like Donepezil. Also, explore the role of amyloid-beta plaques in the progression of Alzheimer's and how current treatments target this mechanism. 
//Finally, are there any ongoing clinical trials investigating novel therapies for early-stage Alzheimer's patients?" });