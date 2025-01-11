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


export async function orchestrateQuery(state: StateType) {
  const { userQuery } = state;
  const chain = taskDecompositionPrompt.pipe(
    llm.withStructuredOutput(DecompositionSchema)
  );
  
  const response = await chain.invoke({ userQuery });
  
  return { 
    ...state, 
    tasks: {
      MedILlama: response.tasks.MedILlama || [],
      WebSearch: response.tasks.Web || []
    }
  };
}
