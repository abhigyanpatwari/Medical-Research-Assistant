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

  // const config = {
  //   channels: {
  //     configurables: {
  //       thread_id: "stream_events"
  //     }
  //   }
  // };

  const config = {
    configurables: {
      thread_id: "stream_events"
    },
    streamMode: "updates" as const
  }

  try {
    // console.log("\nProcessing your query...");
    // const result = await graph.invoke(initialState);

    
    // console.log("\n=== Response ===");
    // console.log(result.finalResponse);

    const stream = await graph.stream(initialState)

    for await (const event of stream) {
      console.log(event)
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

if (import.meta.main) {
  runMedicalQuery();
}
