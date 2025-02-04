import { StateType } from "../schemas/stateSchema.ts";
import { reflectionPrompt } from "../utils/prompts.ts";
import { FINETUNED_MODEL } from "../config.ts";

const model = FINETUNED_MODEL || '';

export async function reflectionAgent(state: StateType) {
  if (!state.finalResponse) {
    return state;
  }

  const iterationCount = (state.iterationCount || 0) + 1;
  if (iterationCount > 3) {
    return state;
  }

  try {
    // Use the reflection prompt that expects the output to start with "PASSED" or "FAILED".
    const chain = reflectionPrompt.pipe(model);
    const result = await chain.invoke({
      userQuery: state.userQuery,
      finalResponse: state.finalResponse,
    });

    // Parse the result, expecting one of:
    // "PASSED |"             -> for a valid, high-quality response.
    // "FAILED | <feedback>"  -> for an inadequate response with feedback.
    const responseText = result.toString().trim();
    let qualityPassed = false;
    let feedback: string | null = null;

    if (responseText.startsWith("PASSED")) {
      qualityPassed = true;
    } else if (responseText.startsWith("FAILED")) {
      qualityPassed = false;
      // Expected format: "FAILED | <feedback>", so extract feedback after the delimiter.
      const separatorPattern = /^FAILED\s*\|\s*(.*)$/i;
      const match = responseText.match(separatorPattern);
      if (match && match[1]) {
        feedback = match[1].trim();
      }
    } else {
      throw new Error("Unable to parse quality indicator from reflection output: " + responseText);
    }

    return {
      ...state,
      reflectionFeedback: qualityPassed ? null : feedback,
      qualityPassed,
      iterationCount,
    };

  } catch (err: unknown) {
    const error = err as Error;
    console.error("❌ Reflection failed:", error.message);
    throw error;
  }
}