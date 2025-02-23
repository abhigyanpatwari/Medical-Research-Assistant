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

    try {
      const graph = createAgentGraph();
      const stream = await graph.stream(initialState);
      for await (const event of stream) {
        socket.send(JSON.stringify(event));
      }
      socket.send(JSON.stringify({ type: "end" }));
    } catch (error: unknown) {
      console.error("Error in workflow:", error);
      socket.send(JSON.stringify({ type: "error", error: (error as Error).message }));
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