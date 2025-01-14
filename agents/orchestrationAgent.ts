import { ChatGroq } from "npm:@langchain/groq";
import { DecompositionSchema } from "../schemas/decompositionSchema.ts";
import { taskDecompositionPrompt, queryEvaluationPrompt } from "../utils/prompts.ts";
import { StateType } from "../schemas/stateSchema.ts";



const llm = new ChatGroq({
  apiKey: Deno.env.get("GROQ_API_KEY") as string,
  model: "llama-3.3-70b-versatile",
  maxRetries: 3,
});


export async function orchestrateQuery(state: StateType) {
  // Check for reflection feedback first
  if (state.reflectionFeedback && !state.qualityPassed) {
    console.log("\n⚠️ Quality check failed. Reflection feedback:", state.reflectionFeedback);
    // TODO: In the future, this feedback can be used to improve the response
  }

  const { userQuery } = state;
  
  // First evaluate query complexity
  // console.log("🤔 Evaluating query complexity...");
  const evaluationChain = queryEvaluationPrompt.pipe(llm);
  const evaluation = await evaluationChain.invoke({ userQuery });
  const response = evaluation.content.toString();

  if (response.startsWith("SIMPLE:")) {
    console.log("💡 Simple query detected, providing direct response...");
    return { 
      ...state,
      finalResponse: response.substring(7).trim(),
      tasks: { MedILlama: [], WebSearch: [], RAG: [] }
    };
  }

  // For complex queries, proceed with task decomposition
  // console.log("🔄 Complex query detected, initiating full workflow...");
  const chain = taskDecompositionPrompt.pipe(
    llm.withStructuredOutput(DecompositionSchema)
  );
  
  const tasks = await chain.invoke({ userQuery });

  // // Log the decomposed tasks in a formatted way
  // // console.log("\n📝 Task decomposition complete:");
  
  // // console.log("\nMedILlama Tasks:");
  // tasks.tasks.MedILlama?.forEach((task, index) => {
  //   // console.log(`  ${index + 1}. ${task.query}`);
  // });
  
  // console.log("\nWebSearch Tasks:");
  // tasks.tasks.Web?.forEach((task, index) => {
  //   console.log(`  ${index + 1}. ${task.query}`);
  // });
  
  // console.log("\nRAG Tasks:");
  // tasks.tasks.RAG?.forEach((task, index) => {
  //   console.log(`  ${index + 1}. ${task.query}`);
  // });

  return { 
    ...state, 
    tasks: {
      MedILlama: tasks.tasks.MedILlama || [],
      WebSearch: tasks.tasks.Web || [],
      RAG: tasks.tasks.RAG || []
    }
  };
}
