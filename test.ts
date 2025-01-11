import { orchestrateQuery } from "./agents/orchestrationAgent.ts";
import { medILlamaAgent } from "./agents/medILlama.ts";
import { webSearchAgent } from "./agents/webSearchAgent.ts";
import { compileAgent } from "./agents/compileAgent.ts";

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
        console.log("\nResponses:");
        result.medILlamaResponse.forEach((response, index) => {
          console.log(`\nQuery ${index + 1}: ${response.metadata.task}`);
          console.log("Response:", response.content);
        });
        break;

      case "w":
        // Test state for Web Search agent
        result = await webSearchAgent({
          userQuery: testQuery,
          tasks: [],
          results: {}
        });
        console.log("\n=== Web Search Results ===");
        console.log("\nSearch Queries Generated:");
        console.log(result.searchQueries.join('\n'));
        
        console.log("\nSearch Summary:");
        console.log(result.searchSummary);
        
        console.log("\nRaw Search Results:");
        console.log("Total results:", result.webSearchResults.length);
        // Only show first 2 results to avoid cluttering console
        console.log(JSON.stringify(result.webSearchResults.slice(0, 2), null, 2));
        break;

      case "c":
        result = await compileAgent({
          userQuery: testQuery,
          tasks: {
            MedILlama: [
              { query: "Explain the mechanism of action of Lecanemab and Donanemab" },
              { query: "What are the latest clinical trial results for these monoclonal antibodies?" }
            ]
          },
          messages: [],
          medILlamaResponse: [
            {
              content: "Detailed explanation of mechanism of action...",
              metadata: { task: "Explain the mechanism of action of Lecanemab and Donanemab" }
            },
            {
              content: "Latest clinical trial results show...",
              metadata: { task: "What are the latest clinical trial results for these monoclonal antibodies?" }
            }
          ],
          webSearchResponse: {
            searchSummary: "Recent studies on immunotherapy...",
            webSearchResults: [
              { title: "Recent Advances in Melanoma Treatment", content: "..." },
              { title: "Clinical Trial Results 2024", content: "..." }
            ]
          },
          ragResponse: "Additional context from medical literature...",
          finalResponse: ""
        });
        console.log("\n=== Compiled Report ===");
        console.log(result.finalResponse);
        break;

      default:
        throw new Error("Unknown agent type");
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

// Test specific agent by passing argument
const agent = Deno.args[0] || "orchestrator";
test(agent); 