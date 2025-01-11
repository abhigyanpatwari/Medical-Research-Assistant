import { ChatGroq } from "npm:@langchain/groq";
import { DecompositionSchema } from "../schemas/decompositionSchema.ts";
import { WorkflowStateSchema } from "../schemas/workflowSchema.ts";
import { z } from "npm:zod";
import { taskDecompositionPrompt } from "../utils/prompts.ts";


const llm = new ChatGroq({
  apiKey: Deno.env.get("GROQ_API_KEY") as string,
  model: "llama-3.3-70b-versatile",
  maxRetries: 3,
});


export async function orchestrateQuery(state: z.infer<typeof WorkflowStateSchema>) {
  const { userQuery } = state;


  const prompt = taskDecompositionPrompt;

  
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