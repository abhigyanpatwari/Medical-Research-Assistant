import { StateGraph } from "npm:@langchain/langgraph";
import { StateType } from "./schemas/stateSchema.ts";
import { medILlamaAgent } from "./agents/medILlama.ts";
import { webSearchAgent } from "./agents/webSearchAgent.ts";
import { compileAgent } from "./agents/compileAgent.ts";
import { orchestrateQuery } from "./agents/orchestrationAgent.ts";
import { StateAnnotation } from "./utils/state.ts";

export function createAgentGraph() {
  const workflow = new StateGraph<StateType>({
    channels: StateAnnotation
  });

  // First define all nodes
  const graph = workflow
    .addNode("orchestrate", async (state) => {
      console.log("🎯 Orchestrator starting...");
      const result = await orchestrateQuery(state);
      console.log("🎯 Orchestrator completed. Tasks created:", result.tasks);
      return result;
    })
    .addNode("medILlama", async (state) => {
      console.log("🏥 MedILlama starting...");
      const result = await medILlamaAgent(state);
      console.log("🏥 MedILlama completed");
      return result;
    })
    .addNode("web_search", async (state) => {
      console.log("🔍 Web Search starting...");
      const result = await webSearchAgent(state);
      console.log("🔍 Web Search completed");
      return result;
    })
    .addNode("compile", async (state) => {
      console.log("📝 Compile starting...");
      const result = await compileAgent(state);
      console.log("📝 Compile completed");
      return result;
    });

  // Then add edges
  graph
    .addEdge("__start__", "orchestrate")
    .addConditionalEdges(
      "orchestrate",
      () => ["medILlama", "web_search"],
      ["medILlama", "web_search"]
    )
    .addEdge("medILlama", "compile")
    .addEdge("web_search", "compile")
    .addEdge("compile", "__end__");

  return workflow.compile();
}