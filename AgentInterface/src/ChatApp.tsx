import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AGENT_IDS = ["evaluate", "medILlama", "web_search", "compile", "reflect"];

export function ChatApp() {
  const [query, setQuery] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [agentOutputs, setAgentOutputs] = useState<Record<string, string>>({});
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());
  
  // Create refs for each agent's panel to enable auto-scrolling
  const agentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const socketRef = useRef<WebSocket | null>(null);

  // Auto-scroll agent panels when new content arrives
  useEffect(() => {
    Object.keys(agentOutputs).forEach(agentId => {
      if (agentRefs.current[agentId]) {
        const panel = agentRefs.current[agentId];
        if (panel) {
          panel.scrollTop = panel.scrollHeight;
        }
      }
    });
  }, [agentOutputs]);

  // Initialize WebSocket connection
  useEffect(() => {
    // Create WebSocket connection
    const socket = new WebSocket("ws://localhost:8080");
    
    socket.onopen = () => {
      console.log("WebSocket connected");
      setConnectionStatus("Connected");
    };
    
    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setConnectionStatus("Disconnected");
      setActiveAgents(new Set());
    };
    
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("Error");
    };
    
    socket.onmessage = (event) => {
      try {
        console.log("Received message:", event.data.slice(0, 100) + "..."); // Log first 100 chars
        const data = JSON.parse(event.data);
        
        if (data.type === "token") {
          const nodeId = data.nodeId;
          console.log(`Token from ${nodeId}: "${data.content}"`);
          
          // Mark this agent as active
          setActiveAgents(prev => {
            const newSet = new Set(prev);
            newSet.add(nodeId);
            return newSet;
          });
          
          // Update the agent output with visual token-by-token feedback
          setAgentOutputs(prev => ({
            ...prev,
            [nodeId]: (prev[nodeId] || "") + data.content
          }));
        } 
        else if (data.type === "state_update") {
          console.log("State update received");
        }
        else if (data.type === "end") {
          console.log("End message received");
          // Add the final response to chat history
          if (data.finalResponse) {
            setChatHistory(prev => [
              ...prev, 
              {role: "assistant", content: data.finalResponse}
            ]);
          }
          
          // Clear active agents after a short delay
          setTimeout(() => {
            setActiveAgents(new Set());
          }, 500);
        }
        else if (data.type === "error") {
          console.error("Error from server:", data.message);
          setConnectionStatus("Error: " + data.message);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };
    
    socketRef.current = socket;
    
    // Clean up on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  // Send message function
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !socketRef.current) return;
    
    // Add user message to chat history
    setChatHistory(prev => [...prev, {role: "user", content: query}]);
    
    // Clear all agent outputs for new query
    setAgentOutputs({});
    
    // Send the query
    if (socketRef.current.readyState === WebSocket.OPEN) {
      console.log("Sending query:", query);
      socketRef.current.send(query);
    } else {
      console.error("WebSocket is not connected");
      setConnectionStatus("Disconnected - Trying to reconnect...");
      // Could add reconnection logic here
    }
    
    // Clear input
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Chatbot Interface</h1>
        <Badge 
          variant={connectionStatus === "Connected" ? "success" : "destructive"}
        >
          {connectionStatus}
        </Badge>
      </header>

      {/* Chat input */}
      <form
        className="mb-4 flex gap-2"
        onSubmit={sendMessage}
      >
        <Input
          placeholder="Enter your query..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button 
          type="submit" 
          disabled={!query.trim() || connectionStatus !== "Connected"}
        >
          Send
        </Button>
      </form>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chat History Panel */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Chat History</CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto h-96 p-4">
            {chatHistory.length > 0 ? (
              chatHistory.map((message, index) => (
                <div 
                  key={index} 
                  className={`mb-4 ${message.role === "user" ? "text-right" : "text-left"}`}
                >
                  <div 
                    className={`inline-block p-3 rounded-lg ${
                      message.role === "user" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p>{message.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Send a message to start the conversation.</p>
            )}
          </CardContent>
        </Card>

        {/* Agent Panels */}
        <div className="flex flex-col gap-4">
          {AGENT_IDS.map((agentId) => (
            <Card key={agentId}>
              <CardHeader className="pb-3">
                <CardTitle className="capitalize flex justify-between items-center">
                  <span>{agentId} Agent</span>
                  {activeAgents.has(agentId) ? (
                    <Badge variant="success" className="animate-pulse">Active</Badge>
                  ) : agentOutputs[agentId] ? (
                    <Badge variant="outline">Completed</Badge>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent 
                className="h-48 overflow-y-auto p-4 bg-gray-100 transition-all duration-200"
                ref={el => agentRefs.current[agentId] = el}
              >
                {agentOutputs[agentId] ? (
                  <pre className="whitespace-pre-wrap">
                    {agentOutputs[agentId]}
                    {activeAgents.has(agentId) && (
                      <span className="inline-block w-2 h-4 bg-current opacity-75 animate-pulse ml-1">|</span>
                    )}
                  </pre>
                ) : (
                  <p className="text-gray-500">Agent output will appear here.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Debug panel - uncomment to see all raw messages */}
      {/*
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>WebSocket Debug</CardTitle>
        </CardHeader>
        <CardContent className="h-48 overflow-y-auto p-4 bg-gray-100">
          <div>Active Agents: {[...activeAgents].join(', ')}</div>
          <pre>{JSON.stringify(agentOutputs, null, 2)}</pre>
        </CardContent>
      </Card>
      */}
    </div>
  );
}

export default ChatApp; 