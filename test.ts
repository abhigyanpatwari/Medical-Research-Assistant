import { orchestrateQuery } from "./agents/orchestrationAgent.ts";
import { medILlamaAgent } from "./agents/medILlama.ts";
import { webSearchAgent } from "./agents/webSearchAgent.ts";

async function test(agent: string = "orchestrator") {
  const testQuery = "What are the latest advancements in the treatment of Alzheimer's disease, including the efficacy of monoclonal antibodies like Lecanemab and Donanemab?";

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