import { createAgentGraph } from "./agentGraph.ts";

async function runMedicalQuery() {
  const graph = createAgentGraph();

  // Get user input
  console.log("Enter your medical query:");
  const userQuery = prompt("> ");

  if (!userQuery) {
    console.log("No query provided. Exiting...");
    return;
  }

  const initialState = {
    messages: [],
    userQuery,
    tasks: {},
    medILlamaResponse: [],
    webSearchResponse: [],
    finalResponse: "",
    iterationCount: 0,
    qualityPassed: true,
    reflectionFeedback: null
  };

  const config = {
    configurables: {
      thread_id: "stream_events"
    },
    streamMode: ["updates", "messages"] as const
  };

  try {
    const stream = await graph.stream(initialState, config);

    for await (const event of stream) {
      // Events now come as tuples with the mode and data
      const [mode, data] = event;
      
      if (mode === "updates") {
        console.log("State update:", data);
      } else if (mode === "messages") {
        // Token streaming data comes with both the message chunk and metadata
        const [messageChunk, metadata] = data;
        console.log(`Token from ${metadata.langgraph_node}: ${messageChunk.content}`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Execute the function when this is the main module
if (import.meta.main) {
  runMedicalQuery();
}
