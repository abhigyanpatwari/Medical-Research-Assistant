import { DecompositionSchema } from "../schemas/decompositionSchema.ts";
import { taskDecompositionPrompt, queryEvaluationPrompt } from "../utils/prompts.ts";
import { StateType } from "../schemas/stateSchema.ts";
import { LLM } from "../config.ts";




const model = LLM;


export async function orchestrateQuery(state: StateType) {
  // Check for reflection feedback first
  if (state.reflectionFeedback && !state.qualityPassed) {
    console.log("\n⚠️ Quality check failed. Reflection feedback:", state.reflectionFeedback);
    // TODO: In the future, this feedback can be used to improve the response
  }

  const { userQuery } = state;
  
  // First evaluate query complexity
  // console.log("🤔 Evaluating query complexity...");
  const evaluationChain = queryEvaluationPrompt.pipe(model);
  const evaluation = await evaluationChain.invoke({ userQuery });
  const response = evaluation.content.toString();

  if (response.startsWith("SIMPLE:")) {
    console.log("💡 Simple query detected, providing direct response...");
    return { 
      ...state,
      finalResponse: response.substring(7).trim(),
      tasks: { MedILlama: [], WebSearch: [], RAG: [] },
      requiredAgents: { medILlama: false, webSearch: false, rag: false }
    };
  }

  // For complex queries, proceed with task decomposition
  // console.log("🔄 Complex query detected, initiating full workflow...");
  const chain = taskDecompositionPrompt.pipe(
    model.withStructuredOutput!(DecompositionSchema)
  );
  

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
  const decomposition = await chain.invoke({ userQuery });

  return { 
    ...state, 
    requiredAgents: decomposition.requiredAgents,
    tasks: {
      MedILlama: decomposition.tasks.MedILlama || [],
      WebSearch: decomposition.tasks.Web || [],
      RAG: decomposition.tasks.RAG || []
    }
  };
}
