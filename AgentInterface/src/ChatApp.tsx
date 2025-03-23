import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SendIcon } from "lucide-react";

const AGENT_IDS = ["evaluate", "orchestrate", "medILlama", "web_search", "compile", "reflect"];

export function ChatApp() {
  const [query, setQuery] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [chatHistory, setChatHistory] = useState<{
    role: string; 
    content: string;
    agents?: Record<string, string>;
    agentsActive?: boolean;
  }[]>([]);
  const [currentAgentOutputs, setCurrentAgentOutputs] = useState<Record<string, string>>({});
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const agentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const socketRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat when content changes
  useEffect(() => {
    setTimeout(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  }, [chatHistory, currentAgentOutputs, activeAgents]);

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    
    socket.onopen = () => {
      console.log("WebSocket connected");
      setConnectionStatus("Connected");
    };
    
    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setConnectionStatus("Disconnected");
      setActiveAgents(new Set());
      setIsProcessing(false);
    };
    
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("Error");
      setIsProcessing(false);
    };
    
    socket.onmessage = (event) => {
      try {
        console.log("Received message:", event.data.slice(0, 100) + "...");
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
          
          // Update the agent output
          setCurrentAgentOutputs(prev => ({
            ...prev,
            [nodeId]: (prev[nodeId] || "") + data.content
          }));
          
          setIsProcessing(true);
        } 
        else if (data.type === "state_update") {
          console.log("State update received", data);
          // Handle special agents that use state updates
          const state = data.data;
          
          // Debug the structure of the state data
          console.log("State structure:", JSON.stringify(state, null, 2));
          
          // Handle orchestrator output from state updates - more flexible handling
          if (state?.orchestrate) {
            console.log("Orchestrate data found:", state.orchestrate);
            
            // Try to handle different possible structures
            const requiredAgents = state.orchestrate.requiredAgents || 
                                  state.orchestrate.agents || 
                                  {};
            
            let orchestrateOutput = "Orchestration plan:\n";
            
            // Try to display whatever information is available
            if (requiredAgents.medILlama !== undefined) {
              orchestrateOutput += `- MedILlama: ${requiredAgents.medILlama ? 'Yes' : 'No'}\n`;
            }
            
            if (requiredAgents.webSearch !== undefined) {
              orchestrateOutput += `- Web Search: ${requiredAgents.webSearch ? 'Yes' : 'No'}\n`;
            }
            
            if (requiredAgents.rag !== undefined) {
              orchestrateOutput += `- RAG: ${requiredAgents.rag ? 'Yes' : 'No'}\n`;
            }
            
            // If there's a reasoning or plan field, include that too
            if (state.orchestrate.reasoning) {
              orchestrateOutput += `\nReasoning: ${state.orchestrate.reasoning}\n`;
            }
            
            if (state.orchestrate.plan) {
              orchestrateOutput += `\nPlan: ${state.orchestrate.plan}\n`;
            }
            
            // Add raw JSON as fallback if nothing else is usable
            if (orchestrateOutput === "Orchestration plan:\n") {
              orchestrateOutput += `Raw data: ${JSON.stringify(state.orchestrate, null, 2)}`;
            }
            
            setCurrentAgentOutputs(prev => ({
              ...prev,
              orchestrate: orchestrateOutput
            }));
            
            setActiveAgents(prev => {
              const newSet = new Set(prev);
              newSet.add("orchestrate");
              return newSet;
            });
            
            setIsProcessing(true);
          }
          
          if (state?.medILlama?.medILlamaResponse) {
            setCurrentAgentOutputs(prev => ({
              ...prev,
              medILlama: state.medILlama.medILlamaResponse
            }));
            
            setActiveAgents(prev => {
              const newSet = new Set(prev);
              newSet.add("medILlama");
              return newSet;
            });
            
            setIsProcessing(true);
          }
          
          if (state?.reflect) {
            let reflectOutput = "";
            if (state.reflect.qualityPassed === false) {
              reflectOutput = state.reflect.reflectionFeedback
                ? `Quality Check Failed:\n${state.reflect.reflectionFeedback}`
                : "Quality check failed. Please try again.";
            } else {
              reflectOutput = "Quality Check Passed. No feedback provided.";
            }
            
            setCurrentAgentOutputs(prev => ({
              ...prev,
              reflect: reflectOutput
            }));
            
            setActiveAgents(prev => {
              const newSet = new Set(prev);
              newSet.add("reflect");
              return newSet;
            });
            
            setIsProcessing(true);
          }
        }
        else if (data.type === "end") {
          console.log("End message received");
          
          // Preserve the agent outputs in chat history
          if (Object.keys(currentAgentOutputs).length > 0) {
            setChatHistory(prev => {
              const newHistory = [...prev];
              const lastUserMessageIndex = [...prev].reverse().findIndex(msg => msg.role === "user");
              if (lastUserMessageIndex >= 0) {
                const realIndex = prev.length - 1 - lastUserMessageIndex;
                newHistory[realIndex] = {
                  ...newHistory[realIndex],
                  agents: {...currentAgentOutputs},
                  agentsActive: false
                };
              }
              return newHistory;
            });
          }
          
          // Add the final response to chat history
          if (data.finalResponse) {
            setChatHistory(prev => [
              ...prev, 
              {role: "assistant", content: data.finalResponse}
            ]);
          }
          
          // Don't clear agent outputs after processing
          // setCurrentAgentOutputs({});
          setActiveAgents(new Set());
          setIsProcessing(false);
        }
        else if (data.type === "error") {
          console.error("Error from server:", data.message);
          setConnectionStatus("Error: " + data.message);
          setIsProcessing(false);
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
    
    // Clear current agent outputs for new query
    setCurrentAgentOutputs({});
    
    // Send the query
    if (socketRef.current.readyState === WebSocket.OPEN) {
      console.log("Sending query:", query);
      socketRef.current.send(JSON.stringify({ userQuery: query }));
      setIsProcessing(true);
    } else {
      console.error("WebSocket is not connected");
      setConnectionStatus("Disconnected - Trying to reconnect...");
    }
    
    // Clear input
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-100 flex flex-col">
      {/* Floating Connection Status */}
      <div className="fixed top-4 right-4 z-10">
        <Badge 
          variant={connectionStatus === "Connected" ? "success" : "destructive"}
          className="animate-fadeIn"
        >
          {connectionStatus}
        </Badge>
      </div>
      
      {/* Main Chat Container */}
      <div className="flex-grow overflow-y-auto pb-24">
        <div className="w-full max-w-4xl mx-auto flex flex-col p-4">
          {/* Welcome Message when empty */}
          {chatHistory.length === 0 && (
            <div className="text-center py-16 animation-fade-in-up">
              <h1 className="text-4xl font-bold mb-4">What do you want to know?</h1>
              <p className="text-gray-400 mb-8">Ask anything to get started</p>
            </div>
          )}
          
          {/* Chat Messages */}
          {chatHistory.map((message, index) => (
            <div key={index} className="mb-8 animation-fade-in-up">
              {/* User Message */}
              {message.role === "user" && (
                <div className="flex justify-end mb-4">
                  <div className="bg-[#2C3E50] rounded-lg p-4 max-w-[80%]">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              )}
              
              {/* Agent Outputs Panel - appears under user message */}
              {message.role === "user" && (
                <>
                  {/* Show current agent outputs if this is the last user message - always show, not just when processing */}
                  {index === chatHistory.length - 1 && (
                    <div className="bg-[#1A1A2E] rounded-lg p-4 mb-4 border border-[#2A2A3E]">
                      <div className="mb-2 flex items-center">
                        {isProcessing ? (
                          <>
                            <div className="flex space-x-1 mr-2">
                              <div className="w-2 h-2 rounded-full bg-[#6D5ACF] animate-bounce" style={{ animationDelay: "0ms" }}></div>
                              <div className="w-2 h-2 rounded-full bg-[#6D5ACF] animate-bounce" style={{ animationDelay: "300ms" }}></div>
                              <div className="w-2 h-2 rounded-full bg-[#6D5ACF] animate-bounce" style={{ animationDelay: "600ms" }}></div>
                            </div>
                            <span className="text-sm text-gray-400">Thinking...</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">Processing complete</span>
                        )}
                      </div>
                      
                      {/* Active Agent Panels */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {AGENT_IDS.map(agentId => (
                          activeAgents.has(agentId) || currentAgentOutputs[agentId] ? (
                            <Card 
                              key={agentId}
                              className="bg-[#1E1E26] border-none shadow-md transition-all duration-300"
                            >
                              <CardHeader className="py-2 px-3">
                                <CardTitle className="capitalize text-xs flex justify-between items-center">
                                  <span>{agentId}</span>
                                  {activeAgents.has(agentId) ? (
                                    <Badge variant="success" className="animate-pulse text-xs h-5">Active</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs h-5">Completed</Badge>
                                  )}
                                </CardTitle>
                              </CardHeader>
                              <CardContent 
                                className="max-h-40 overflow-y-auto p-3 text-xs font-mono text-gray-300"
                                ref={el => agentRefs.current[agentId] = el}
                              >
                                <div className="whitespace-pre-wrap">
                                  {currentAgentOutputs[agentId]}
                                  {activeAgents.has(agentId) && (
                                    <span className="inline-block w-1.5 h-3 bg-[#6D5ACF] opacity-75 animate-pulse ml-1">|</span>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ) : null
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Show saved agent outputs for previous user messages */}
                  {message.agents && Object.keys(message.agents).length > 0 && (
                    <div className="bg-[#1A1A2E] rounded-lg p-4 mb-4 border border-[#2A2A3E]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(message.agents).map(([agentId, output]) => (
                          output ? (
                            <Card 
                              key={agentId}
                              className="bg-[#1E1E26] border-none shadow-md"
                            >
                              <CardHeader className="py-2 px-3">
                                <CardTitle className="capitalize text-xs flex justify-between items-center">
                                  <span>{agentId}</span>
                                  <Badge variant="outline" className="text-xs h-5">Completed</Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="max-h-40 overflow-y-auto p-3 text-xs font-mono text-gray-300">
                                <div className="whitespace-pre-wrap">{output}</div>
                              </CardContent>
                            </Card>
                          ) : null
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Assistant Message */}
              {message.role === "assistant" && (
                <div className="flex justify-start mb-4">
                  <div className="bg-[#1A1A2E] rounded-lg p-4 max-w-[80%] border-l-4 border-[#6D5ACF]">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              )}

              {/* Compile Agent Output as a Chatbot Response */}
              {message.role === "assistant" && message.agents && message.agents["compile"] && (
                <div className="flex justify-start mb-4 animation-fade-in-up" style={{ animationDelay: "300ms" }}>
                  <div className="bg-[#1A1A2E] rounded-lg p-4 max-w-[80%] border-l-4 border-[#6D5ACF]">
                    <div className="text-xs text-gray-400 mb-1">Compiled Result</div>
                    <p className="whitespace-pre-wrap font-mono">{message.agents["compile"]}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Element for scrolling to bottom */}
          <div ref={bottomRef} />
        </div>
      </div>
      
      {/* Fixed Input Bar at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#2A2A3E] py-4 px-4">
        <div className="w-full max-w-4xl mx-auto">
          <form
            className="relative rounded-full shadow-lg overflow-hidden"
            onSubmit={sendMessage}
          >
            <Input
              placeholder="Ask anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full py-6 px-6 bg-[#1E1E1E] border-none text-gray-100 focus:outline-none focus:ring-0 focus:border-none placeholder:text-gray-500"
            />
            <Button 
              type="submit" 
              disabled={!query.trim() || connectionStatus !== "Connected"}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full p-3 bg-[#6D5ACF] hover:bg-[#8A7CE0] transition-colors"
            >
              <SendIcon size={18} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatApp; 