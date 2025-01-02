import { orchestrateQuery } from "./agents/orchestrationAgent.ts";
import { medILlamaAgent } from "./agents/medILlama.ts";
import { webSearchAgent } from "./agents/webSearchAgent.ts";

async function test(agent: string = "orchestrator") {
  const testQuery = "Can you provide a detailed analysis of the current state of immunotherapy for melanoma, including its mechanisms of action, efficacy compared to traditional treatments, common side effects, and the latest advancements or clinical trials in this field?";

  try {
    let result;
    switch (agent) {
      case "o":
        result = await orchestrateQuery({
          userQuery: testQuery,
          tasks: [],
          results: {}
        });
        console.log("Orchestration Result:");
        break;

      case "m":
        // Test state with predefined MedILlama tasks
        result = await medILlamaAgent({
          userQuery: testQuery,
          tasks: {
            MedILlama: [
              { query: "Explain the mechanism of action of Lecanemab and Donanemab" },
              { query: "What are the latest clinical trial results for these monoclonal antibodies?" }
            ]
          },
          messages: [],
          medILlamaResponse: [],
          webSearchResponse: [],
          ragResponse: [],
          finalResponse: ""
        });
        console.log("MedILlama Result:");
        break;

      case "w":
        // Test state with predefined Web Search tasks
        result = await webSearchAgent({
          userQuery: testQuery,
          tasks: [
            { query: "Latest clinical trial results Lecanemab Donanemab Alzheimer's" },
            { query: "Recent FDA approvals monoclonal antibodies Alzheimer's treatment" }
          ],
          results: {}
        });
        console.log("Web Search Result:");
        break;

      default:
        throw new Error("Unknown agent type");
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

// Test specific agent by passing argument
const agent = Deno.args[0] || "orchestrator";
test(agent); 