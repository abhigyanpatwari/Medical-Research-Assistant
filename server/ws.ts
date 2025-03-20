import { createAgentGraph } from "../agentGraph.ts";
import type { StateType } from "../schemas/stateSchema.ts";

interface Payload {
  userQuery: string;
}

Deno.serve({ port: 8080 }, async (req: Request): Promise<Response> => {
  // Ensure the request is for a WebSocket connection.
  const upgradeHeader = req.headers.get("upgrade");
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("This endpoint only accepts WebSocket connections", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    console.log("WebSocket connection opened");
  };

  socket.onmessage = async (event: MessageEvent<string>) => {
    const message = event.data;
    console.log("Received message:", message);

    // Try to parse the incoming message as JSON. If that fails, treat it as a user query.
    let payload: Payload;
    try {
      payload = JSON.parse(message);
    } catch (error) {
      payload = { userQuery: message };
    }

    // Build the initial state using the provided user query.
    const initialState: StateType = {
      messages: [],
      userQuery: payload.userQuery,
      tasks: {},
      medILlamaResponse: [],
      webSearchResponse: [],
      finalResponse: "",
      iterationCount: 0,
      qualityPassed: true,
      reflectionFeedback: null,
      requiredAgents: { medILlama: false, webSearch: false, rag: false },
      isSimpleQuery: false,
    };

    // Track the final state to access after streaming is complete
    let finalState: StateType | null = null;

    try {
      const graph = createAgentGraph();
      
      // Configure streaming to include both updates and token-by-token messages
      const config = {
        configurables: {
          thread_id: "stream_events"
        },
        streamMode: ["updates", "messages"] as const
      };
      
      const stream = await graph.stream(initialState, config);
      
      for await (const event of stream) {
        if (socket.readyState === WebSocket.OPEN) {
          const [mode, data] = event;
          
          if (mode === "updates") {
            // Store the latest state for the end message
            finalState = data as StateType;
            
            // Send state updates with type marker
            socket.send(JSON.stringify({
              type: "state_update",
              data
            }));
          } else if (mode === "messages") {
            // Send token streaming data with type marker
            const [messageChunk, metadata] = data;
            socket.send(JSON.stringify({
              type: "token",
              content: messageChunk.content,
              nodeId: metadata.langgraph_node,
              metadata
            }));
          }
        } else {
          console.warn("WebSocket closed while streaming.");
          break;
        }
      }

      // Signal completion with the final response from the final state
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
          type: "end", 
          message: "Workflow complete.", 
          // finalResponse: state?.finalResponse || ""
        }));
      }
    } catch (error: unknown) {
      console.error("Error during workflow processing:", error);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "error", message: (error as Error).message }));
      }
    }
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
  };

  socket.onerror = (error: Event) => {
    console.error("WebSocket error:", error);
  };

  return response;
});

