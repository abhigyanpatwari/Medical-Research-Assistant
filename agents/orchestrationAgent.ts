import { DecompositionSchema, DecompositionSchemaType } from "../schemas/decompositionSchema.ts";
import { taskDecompositionPrompt, improvementPrompt } from "../utils/prompts.ts";
import { StateType, OrchestrationData } from "../schemas/stateSchema.ts";
import { LLM } from "../config.ts";
import { MAX_ITERATIONS } from "../config.ts";

const model = LLM;

export async function orchestrateQuery(state: StateType) {
  // Reset accumulated responses for a new iteration!
  // This clears responses from previous iterations so that only the current cycle's results are used.
  state.medILlamaResponse = [];
  state.webSearchResponse = [];

  // Check for reflection feedback first.
  // If quality has not passed and we're still within the maximum iteration count,
  // then run the improvement/decomposition prompt.
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
    
    // Create orchestration data with reasoning and plan
    const orchestrationData: OrchestrationData = {
      requiredAgents: improvedDecomposition.requiredAgents,
      reasoning: `Improvement based on feedback: ${state.reflectionFeedback}`,
      plan: `Revised plan for iteration ${(state.iterationCount ?? 0) + 1}: 
${improvedDecomposition.requiredAgents.medILlama ? '1. Use MedILlama for medical expertise' : ''}
${improvedDecomposition.requiredAgents.webSearch ? '2. Use Web Search for latest information' : ''}
${improvedDecomposition.requiredAgents.rag ? '3. Use RAG for contextual knowledge' : ''}`
    };
    
    return { 
      ...state, 
      orchestrationData: orchestrationData,
      tasks: {
        MedILlama: improvedDecomposition.tasks.MedILlama || [],
        WebSearch: improvedDecomposition.tasks.Web || [],
        // RAG: improvedDecomposition.tasks.RAG || []
      },
      // Keep the requiredAgents for backward compatibility
      requiredAgents: improvedDecomposition.requiredAgents
    };
  }

  const initialDecompositionChain = taskDecompositionPrompt.pipe(
    model.withStructuredOutput!(DecompositionSchema)
  );
   
  const initialDecomposition = await initialDecompositionChain.invoke({ 
    userQuery: state.userQuery 
  }) as DecompositionSchemaType;

  // Create orchestration data with reasoning and plan for initial decomposition
  const orchestrationData: OrchestrationData = {
    requiredAgents: initialDecomposition.requiredAgents,
    reasoning: `Initial analysis of query: "${state.userQuery}"`,
    plan: `Execution plan:
${initialDecomposition.requiredAgents.medILlama ? '1. Use MedILlama for medical expertise' : ''}
${initialDecomposition.requiredAgents.webSearch ? '2. Use Web Search for latest information' : ''}
${initialDecomposition.requiredAgents.rag ? '3. Use RAG for contextual knowledge' : ''}
4. Compile results into comprehensive response`
  };

  return { 
    ...state, 
    orchestrationData: orchestrationData,
    tasks: {
      MedILlama: initialDecomposition.tasks.MedILlama || [],
      WebSearch: initialDecomposition.tasks.Web || [],
      // RAG: initialDecomposition.tasks.RAG || []
    },
    // Keep the requiredAgents for backward compatibility
    requiredAgents: initialDecomposition.requiredAgents
  };
}
