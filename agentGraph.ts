import { StateGraph } from "npm:@langchain/langgraph";
import { StateType } from "./schemas/stateSchema.ts";
import { medILlamaAgent } from "./agents/medILlama.ts";
import { webSearchAgent } from "./agents/webSearchAgent.ts";
import { compileAgent } from "./agents/compileAgent.ts";
import { orchestrateQuery } from "./agents/orchestrationAgent.ts";
import { StateAnnotation } from "./utils/state.ts";
import { evaluationAgent } from "./agents/evaluationAgent.ts";
import { reflectionAgent } from "./agents/reflectionAgent.ts";


export function createAgentGraph() {
  const workflow = new StateGraph<StateType>({
    channels: StateAnnotation
  });

  const graph = workflow
    .addNode("evaluate", evaluationAgent)
    .addNode("orchestrate", orchestrateQuery)
    .addNode("medILlama", medILlamaAgent)
    .addNode("web_search", webSearchAgent)
    .addNode("compile", compileAgent)
    .addNode("reflect", reflectionAgent);

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
      (state) => {
        const nextNodes = [];
        const agents = state.requiredAgents ?? { medILlama: false, webSearch: false, rag: false };
        if (agents.medILlama) nextNodes.push("medILlama");
        if (agents.webSearch) nextNodes.push("web_search");
        return nextNodes;
      },
      ["medILlama", "web_search"]
    )
    .addEdge(["medILlama", "web_search"] as any, "compile")
    .addEdge("compile", "reflect")
    .addEdge("reflect", "__end__");

  return workflow.compile();
}

