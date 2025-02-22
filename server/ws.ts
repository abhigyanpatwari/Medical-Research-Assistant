// This file creates a WebSocket endpoint for streaming LangGraph workflow events.
// It uses Deno's built-in support for upgrading HTTP requests to WebSocket connections 
// and streams the events from createAgentGraph().stream() to the client.

import { serve } from "https://deno.land/std@0.152.0/http/server.ts";
import { createAgentGraph } from "../agentGraph.ts";

console.log("WebSocket server listening on http://localhost:8080/");

serve(async (req: Request): Promise<Response> => {
  // Upgrade the HTTP connection to a WebSocket connection.
  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    console.log("WebSocket connection opened");
  };

  // When a message is received from the client, assume it contains a JSON
  // payload with the userQuery to start the workflow.
  socket.onmessage = async (e: MessageEvent<string>) => {
    console.log("Received message:", e.data);

    let payload: { userQuery: string };
    try {
      payload = JSON.parse(e.data);
    } catch (error) {
      // If the parsing fails, treat the entire message as the user query.
      payload = { userQuery: e.data };
    }

    // Build the initial state using the provided user query.
    const initialState = {
      messages: [],
      userQuery: payload.userQuery,
      tasks: {},
      medILlamaResponse: [],
      webSearchResponse: [],
      finalResponse: "",
      iterationCount: 0,
      qualityPassed: true,
      reflectionFeedback: null,
      // Initially, requiredAgents is false. The orchestrator will update it.
      requiredAgents: { medILlama: false, webSearch: false, rag: false }
    };

    try {
      // Create the workflow graph and run it in streaming mode.
      const graph = createAgentGraph();

      for await (const event of graph.stream(initialState)) {
        // Send the event to the client; each event is JSON-stringified.
        socket.send(JSON.stringify(event));
      }
      
      // Once completed, send a final message.
      socket.send(JSON.stringify({ type: "end" }));
    } catch (error) {
      console.error("Error in workflow:", error);
      socket.send(JSON.stringify({ type: "error", error: error.message }));
    }
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
  };

  socket.onerror = (err) => {
    console.error("WebSocket error:", err);
  };

  return response;
}); 