import { createAgentGraph } from "../agentGraph.ts";
import type { StateType } from "../schemas/stateSchema.ts";

interface Payload {
  userQuery: string;
}

Deno.serve({ port: 8080 }, async (req: Request): Promise<Response> => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response("This endpoint only accepts POST requests", { status: 405 });
  }

  try {
    // Parse the request body
    let payload: Payload;
    try {
      payload = await req.json();
    } catch (error) {
      // If JSON parsing fails, check if there's a text body that could be a user query
      const text = await req.text();
      if (text) {
        payload = { userQuery: text };
      } else {
        return new Response("Invalid request: expected JSON body or text", { status: 400 });
      }
    }

    if (!payload.userQuery) {
      return new Response("Missing userQuery in request", { status: 400 });
    }

    // Build the initial state using the provided user query.
    const initialState: StateType = {
      messages: [],
      userQuery: payload.userQuery,
      tasks: {},
      medILlamaResponse: "",
      webSearchResponse: "",
      finalResponse: "",
      iterationCount: 0,
      qualityPassed: true,
      reflectionFeedback: null,
      requiredAgents: { medILlama: false, webSearch: false, rag: false },
      isSimpleQuery: false,
    };

    // Create a stream to send response events
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Process graph events in the background
    (async () => {
      try {
        const graph = createAgentGraph();
        const stream = await graph.stream(initialState);
        
        for await (const event of stream) {
          // Write each event as a JSON line (with newline separator for streaming)
          await writer.write(encoder.encode(JSON.stringify(event) + "\n"));
        }
        
        // Signal completion
        await writer.write(encoder.encode(JSON.stringify({ type: "end", message: "Workflow complete." }) + "\n"));
        await writer.close();
      } catch (error) {
        console.error("Error during workflow processing:", error);
        await writer.write(
          encoder.encode(JSON.stringify({ type: "error", message: (error as Error).message }) + "\n")
        );
        await writer.close();
      }
    })();

    // Return the stream as the response
    return new Response(readable, {
      headers: {
        "Content-Type": "application/json-stream",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
    
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ type: "error", message: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
