import { DecompositionSchema, DecompositionSchemaType } from "../schemas/decompositionSchema.ts";
import { taskDecompositionPrompt, improvementPrompt } from "../utils/prompts.ts";
import { StateType } from "../schemas/stateSchema.ts";
import { LLM } from "../config.ts";
import { MAX_ITERATIONS } from "../config.ts";

const model = LLM;

export async function orchestrateQuery(state: StateType) {
  // Check for reflection feedback first. Invokes the improvement prompt if the quality check failed.
  if (!state.qualityPassed && (state.iterationCount ?? 0) <= MAX_ITERATIONS) {
    console.log(`\n\n\n\n⚠️ Quality check failed. Reflection feedback: ${state.reflectionFeedback} \n\n\n\n`);
    const improvementDecompositionChain = improvementPrompt.pipe(
      model.withStructuredOutput!(DecompositionSchema)
    );

    const improvedDecomposition = await improvementDecompositionChain.invoke({
      previousResponse: state.finalResponse,
      improvementFeedback: state.reflectionFeedback,
      userQuery: state.userQuery
    }) as DecompositionSchemaType;
    
    return { 
      ...state, 
      requiredAgents: improvedDecomposition.requiredAgents,
      tasks: {
        MedILlama: improvedDecomposition.tasks.MedILlama || [],
        WebSearch: improvedDecomposition.tasks.Web || [],
        // RAG: decomposition.tasks.RAG || []
      }
    };
  }

   
  const initialDecompositionChain = taskDecompositionPrompt.pipe(
    model.withStructuredOutput!(DecompositionSchema)
  );
   
  const initialDecomposition = await initialDecompositionChain.invoke({ 
    userQuery: state.userQuery 
  }) as DecompositionSchemaType;

  return { 
    ...state, 
    requiredAgents: initialDecomposition.requiredAgents,
    tasks: {
      MedILlama: initialDecomposition.tasks.MedILlama || [],
      WebSearch: initialDecomposition.tasks.Web || [],
      // RAG: decomposition.tasks.RAG || []
    }
  };
}
