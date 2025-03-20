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
    // streamMode: ["updates", "messages"] as const
    streamMode: ["updates"] as const
  };

  try {
    const stream = await graph.stream(initialState, config);

    for await (const event of stream) {
      const [mode, data] = event;
      
      if (mode === "updates") {
        console.log("State update:", data);
      } else if (mode === "messages") {
        const [messageChunk, metadata] = data;
        if (metadata.langgraph_node === "medILlama") {
          process.stdout.write(messageChunk.content); // Stream tokens to console
        }
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
