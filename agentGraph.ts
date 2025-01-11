import { StateGraph } from "npm:@langchain/langgraph";
import { StateType } from "./schemas/stateSchema.ts";
import { medILlamaAgent } from "./agents/medILlama.ts";
import { webSearchAgent } from "./agents/webSearchAgent.ts";
import { compileAgent } from "./agents/compileAgent.ts";
import { orchestrateQuery } from "./agents/orchestrationAgent.ts";
import { StateAnnotation } from "./utils/state.ts";
import { evaluationAgent } from "./agents/evaluationAgent.ts";

export function createAgentGraph() {
  const workflow = new StateGraph<StateType>({
    channels: StateAnnotation
  });

  const graph = workflow
    .addNode("evaluate", evaluationAgent)
    .addNode("orchestrate", orchestrateQuery)
    .addNode("medILlama", medILlamaAgent)
    .addNode("web_search", webSearchAgent)
    .addNode("compile", compileAgent);

  // Define the flow
  graph
    .addEdge("__start__", "evaluate")
    .addConditionalEdges(
      "evaluate",
      (state) => state.isSimpleQuery ? ["__end__"] : ["orchestrate"],
      ["__end__", "orchestrate"]
    )
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