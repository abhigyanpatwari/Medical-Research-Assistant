import { StateGraph } from "npm:@langchain/langgraph";
import { StateType } from "./schemas/stateSchema.ts";
import { medILlamaAgent } from "./agents/medILlama.ts";
import { webSearchAgent } from "./agents/webSearchAgent.ts";
import { compileAgent } from "./agents/compileAgent.ts";
import { orchestrateQuery } from "./agents/orchestrationAgent.ts";
import { StateAnnotation } from "./utils/state.ts";
import { evaluationAgent } from "./agents/evaluationAgent.ts";
import { reflectionAgent } from "./agents/reflectionAgent.ts";  
import { MAX_ITERATIONS } from "./config.ts";


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
    .addNode("reflect", reflectionAgent)

  // Define the flow
  graph
    .addEdge("__start__", "evaluate")
    .addConditionalEdges(
      "evaluate",
      (state: StateType) => state.isSimpleQuery ? ["__end__"] : ["orchestrate"],
      ["__end__", "orchestrate"]
    )
    .addConditionalEdges(
      "orchestrate",
      (state: StateType) => {
        const nextNodes = [];
        const agents = state.requiredAgents ?? { medILlama: false, webSearch: false, rag: false };
        if (agents.medILlama) nextNodes.push("medILlama");
        if (agents.webSearch) nextNodes.push("web_search");
        return nextNodes.length > 0 ? nextNodes : ["compile"];
      },
      ["medILlama", "web_search", "compile"]
    )
    .addEdge("medILlama", "compile")
    .addEdge("web_search", "compile")
    
    // .addEdge("compile", "reflect")                    
    // .addConditionalEdges(
    //   "reflect",
    //   (state: StateType) => {
    //     const iterationCount = state.iterationCount ?? 0;
    //     console.log(`\n🔄 Iteration ${iterationCount} completed`);
    //     
    //     if (!state.qualityPassed && iterationCount < MAX_ITERATIONS) {
    //       console.log(`⚠️ Quality check failed. Starting iteration ${iterationCount + 1}...`);
    //       return ["orchestrate"];
    //     } else {
    //       if (!state.qualityPassed) {
    //         console.log("⚠️ Max iterations reached. Ending workflow.");
    //       } else {
    //         console.log("✅ Quality check passed. Ending workflow.");
    //       }
    //       return ["__end__"];
    //     }
    //   },
    //   {
    //     "orchestrate": "orchestrate",
    //     "__end__": "__end__"
    //   }
    // )
    .addEdge("compile", "reflect")
    .addConditionalEdges(
      "reflect",
      (state: StateType) => {
        if (state.qualityPassed || (state.iterationCount ?? 0) >= MAX_ITERATIONS) {
          return ["__end__"];
        }
        return ["orchestrate"];
      },
      ["__end__", "orchestrate"]
    );

  // Add streaming support to the graph configuration
  const config = {
    configurables: {
      thread_id: "stream_events"
    },
    streamMode: ["updates", "messages"] as const,
    stream: {
      output: (chunk: any, nodeId: string) => {
        if (nodeId === "medILlama") {
          return { content: chunk.content, nodeId: "medILlama" };
        }
        return chunk;
      }
    }
  };

  return workflow.compile();
}

