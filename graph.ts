import { StateGraph } from "npm:@langchain/langgraph";
import { StateAnnotation } from "./utils/state.ts";
import { orchestrateQuery } from "./agents/orchestrationAgent.ts";
import { medILlamaAgent } from "./agents/mediLlamaAgent.ts";
import { webSearchAgent } from "./agents/webSearchAgent.ts";
import { ragAgent } from "./agents/ragAgent.ts";
import { aggregateResponses } from "./agents/aggregationAgent.ts";

// Create the graph
const workflow = new StateGraph(StateAnnotation)
  // Add nodes for each agent
  .addNode("orchestrator", orchestrateQuery)
  .addNode("medILlama", medILlamaAgent)
  .addNode("webSearch", webSearchAgent)
  .addNode("rag", ragAgent)
  .addNode("aggregator", aggregateResponses)

  // Set orchestrator as entry point
  .addEdge("__start__", "orchestrator")

  // Add conditional routing based on task assignments
  .addConditionalEdges(
    "orchestrator",
    (state) => {
      const nextNodes = [];
      // Check which agents have tasks assigned in the DecompositionSchema
      if (state.tasks.MedILlama?.length > 0) nextNodes.push("medILlama");
      if (state.tasks.Web?.length > 0) nextNodes.push("webSearch");
      if (state.tasks.RAG?.length > 0) nextNodes.push("rag");
      return nextNodes.length ? nextNodes : ["aggregator"];
    },
    ["medILlama", "webSearch", "rag", "aggregator"]
  )

  // Route all agent outputs to aggregator
  .addEdge("medILlama", "aggregator")
  .addEdge("webSearch", "aggregator")
  .addEdge("rag", "aggregator")
  .addEdge("aggregator", "__end__");

// Compile the graph
export const graph = workflow.compile();
