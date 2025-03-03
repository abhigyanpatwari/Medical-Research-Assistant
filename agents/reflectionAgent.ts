import { StateType } from "../schemas/stateSchema.ts";


import ollama from "npm:ollama";
import { zodToJsonSchema } from "npm:zod-to-json-schema";
import { z } from "npm:zod";


const model = Deno.env.get("OLLAMA_MODEL") as string //Cant use FINETUNED_MODEL import from config here because it's set in a different way for langchain and this agent uses ollama directly

const systemPrompt = `You are a specialized medical knowledge quality check agent. Your task is to critically review the following medical response for accuracy, completeness, identify knowledge gaps and adherence to current evidence-based medical standards.

Only provide feedback if there are:
1. **Significant Medical Inaccuracies or Outdated Information:** Verify that all medical facts, diagnoses, and treatment recommendations are accurate and up-to-date with current guidelines.
2. **Critical Missing Details:** Check if any important information regarding diagnosis, treatment options, adverse reactions, contraindications, or clinical guidelines is missing.
3. **Terminological or Communication Issues:** Ensure that medical terminology is used correctly and that explanations are clear enough for both experts and patients when appropriate.
4. **Inconsistencies or Potentially Harmful Advice:** Identify any major inconsistencies in the clinical recommendations or if any advice might be potentially harmful.
5. **Knowledge Gaps:** Identify any major knowledge gaps in the response.

IMPORTANT: Set the qualityPassed to true if the response is good, and false if it is not. If the response is good, set the feedback to null. If the response is not good, set the feedback to the feedback you would give to improve the response.`


//System prompt to test the agent
// const systemPrompt = `You are a specialized medical knowledge quality check agent. Your task is to critically review the following medical response for accuracy, completeness, identify knowledge gaps and adherence to current evidence-based medical standards.

// Provide feedback to better the response in terms of medical accuracy, completeness, and adherence to current evidence-based medical standards. 

// IMPORTANT: Set the qualityPassed to false and generate feedback to improve the response.

// IMPORTANT: Never set the quality passed to true. Always false`

export async function reflectionAgent(state: StateType) {
  if (!state.finalResponse) {
    return state;
  }

  const iterationCount = (state.iterationCount || 0) + 1;
  if (iterationCount > 3) {
    return state;
  }

  try {
    const reflectionSchema = z.object({
      qualityPassed: z.boolean(),
      feedback: z.string().optional()
    });

  
    const formattedUserPrompt = `
      User Query: ${state.userQuery}
      Current Medical Response: ${state.finalResponse}`

    const response = await ollama.chat({
      model: model.toString(),
      messages: [
        { 
          role: "system", 
          content: systemPrompt
        },
        {
          role: "user",
          content: formattedUserPrompt
        }
      ],
      format: zodToJsonSchema(reflectionSchema)
    });

    
    const parsedResponse = reflectionSchema.parse(JSON.parse(response.message.content));
    // console.log(parsedResponse);

    return {
      ...state,
      iterationCount,
      qualityPassed: parsedResponse.qualityPassed,
      reflectionFeedback: parsedResponse.feedback || null
    };

  } catch (err: unknown) {
    const error = err as Error;
    console.error("❌ Reflection failed:", error.message);
    throw error;
  }
}