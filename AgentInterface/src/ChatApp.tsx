import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SendIcon, Cpu, Search, Brain, Code, ListChecks, RefreshCcw, Database, ChevronDown, ChevronUp, X } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from "framer-motion";
import AgentDiagram from "./components/AgentDiagram";
import { AGENT_NODES } from "./components/AgentDiagram";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Agent IDs should match the node IDs in your backend
const AGENT_IDS = ["evaluate", "orchestrate", "medILlama", "web_search", "rag", "compile", "reflect"];

// Agent config for visual styling and icons
const AGENT_CONFIG = {
  orchestrate: { 
    color: "#4A6FA5", 
    icon: <ListChecks size={16} />, 
    title: "Orchestrator",
    description: "Planning and coordination"
  },
  medILlama: { 
    color: "#6D5ACF", 
    icon: <Brain size={16} />, 
    title: "Medical LLM",
    description: "Medical knowledge"
  },
  web_search: { 
    color: "#36A2EB", 
    icon: <Search size={16} />, 
    title: "Web Search",
    description: "Internet search results"
  },
  evaluate: { 
    color: "#4CAF50", 
    icon: <Cpu size={16} />, 
    title: "Evaluator",
    description: "Answer assessment" 
  },
  compile: { 
    color: "#FF9F43", 
    icon: <Code size={16} />, 
    title: "Compiler",
    description: "Final answer compilation"
  },
  reflect: { 
    color: "#FF6384", 
    icon: <RefreshCcw size={16} />, 
    title: "Reflector",
    description: "Quality check and feedback"
  },
  rag: {
    color: "#9333ea",
    icon: <Database size={16} />,
    title: "RAG",
    description: "Retrieval Augmented Generation"
  }
};

export function ChatApp() {
  const [query, setQuery] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());
  const [completedAgents, setCompletedAgents] = useState<Set<string>>(new Set());
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [agentOutputs, setAgentOutputs] = useState<Record<string, string>>({});
  const [finalResponse, setFinalResponse] = useState<string>("");
  const [userInput, setUserInput] = useState<string>("");
  const [showResponseModal, setShowResponseModal] = useState<boolean>(false);
  
  // WebSocket reference
  const ws = useRef<WebSocket | null>(null);
  
  // Add this state and refs
  const agentTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  
  // Connect to WebSocket when component mounts
  useEffect(() => {
    // Create WebSocket connection
    const socket = new WebSocket("ws://localhost:8080");
    
    socket.onopen = () => {
      console.log("WebSocket connected");
      setConnectionStatus("Connected");
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setConnectionStatus("Disconnected");
    };
    
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("Error");
    };
    
    ws.current = socket;
    
    // Clean up on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);
  
  // Add this useEffect to initialize agents on component mount
  useEffect(() => {
    // Initialize critical agents to be visible on load
    const initialAgents = ["orchestrate", "medILlama", "web_search", "compile", "reflect"];
    
    // Initialize expanded agents
    setExpandedAgents(new Set(initialAgents));
    
    // Set initial placeholder text for key agents
    const initialOutputs: Record<string, string> = {};
    initialAgents.forEach(agent => {
      initialOutputs[agent] = `${agent} will be activated when needed...`;
    });
    setAgentOutputs(initialOutputs);
  }, []);
  
  // Improved WebSocket message handler with more robust ID mapping and debugging
  const handleWebSocketMessage = (data: any) => {
    console.log("Received WebSocket message:", data);
    
    switch (data.type) {
      case "state_update":
        console.log("State update received:", data.data);
        updateAgentStates(data.data);
        break;
        
      case "token":
        console.log(`Token from ${data.nodeId}:`, data.content);
        
        // If the nodeId exists in the message
        if (data.nodeId) {
          // Standardize agent IDs - the backend might use different casing or naming
          let nodeId = String(data.nodeId).toLowerCase();
          
          // Map possible backend node IDs to our frontend IDs
          const idMapping: Record<string, string> = {
            "orchestration": "orchestrate",
            "orchestrator": "orchestrate",
            "medillama": "medILlama",
            "med_llama": "medILlama",
            "medilama": "medILlama",
            "medical_llm": "medILlama",
            "websearch": "web_search",
            "web-search": "web_search",
            "evaluation": "evaluate",
            "reflection": "reflect",
            "compilation": "compile",
            "compiler": "compile"
          };
          
          // Convert to our standardized ID if mapping exists
          if (idMapping[nodeId]) {
            nodeId = idMapping[nodeId];
          } else if (AGENT_IDS.includes(nodeId)) {
            // Use as-is if it's already a valid ID     
            nodeId = nodeId;
          } else if (AGENT_IDS.includes(data.nodeId)) {
            // Use exact case from data if it matches our IDs
            nodeId = data.nodeId;
          }
          
          console.log(`Mapped node ID "${data.nodeId}" to "${nodeId}"`);
          
          // Check if this is a valid agent ID after mapping
          if (AGENT_IDS.includes(nodeId)) {
            // Mark this agent as active
            activateAgent(nodeId);
            
            // Auto-expand this agent
            setExpandedAgents(prev => {
              const newSet = new Set(prev);
              newSet.add(nodeId);
              return newSet;
            });
            
            // Make sure content is not null/undefined before appending
            const contentToAdd = data.content || "";
            
            // Update the agent's output - concatenate new tokens
            setAgentOutputs(prev => {
              const newOutputs = { ...prev };
              
              if (!newOutputs[nodeId] || newOutputs[nodeId].includes("will be activated")) {
                // Replace placeholder text completely
                newOutputs[nodeId] = contentToAdd;
                console.log(`Initialized content for ${nodeId}: "${contentToAdd.substring(0, 20)}..."`);
              } else {
                // Append to existing real content
                newOutputs[nodeId] += contentToAdd;
                console.log(`Appended content to ${nodeId}, new length: ${newOutputs[nodeId].length}`);
              }
              
              return newOutputs;
            });
          } else {
            console.warn(`Received token from unknown agent: ${data.nodeId} (mapped to ${nodeId})`);
          }
        } else if (data.metadata?.langgraph_node) {
          // Alternative source of nodeId from metadata
          const metadataNodeId = data.metadata.langgraph_node;
          console.log(`Using metadata node ID: ${metadataNodeId}`);
          
          // Recursively call this handler with the node ID from metadata
          handleWebSocketMessage({
            ...data,
            nodeId: metadataNodeId
          });
        } else {
          console.warn("Received token without nodeId:", data);
        }
        break;
        
      case "end":
        console.log("Workflow complete:", data);
        if (data.finalResponse) {
          setFinalResponse(data.finalResponse);
          
          // Show the modal with the final response
          setShowResponseModal(true);
        }
        break;
        
      case "error":
        console.error("Backend error:", data.message);
        
        // Show error in the modal
        setFinalResponse(`**Error:** ${data.message || "An unknown error occurred"}`);
        setShowResponseModal(true);
        break;
        
      default:
        console.log("Unknown message type:", data);
        
        // Try to extract useful information from unknown message types
        if (data.metadata?.langgraph_node && data.content) {
          console.log("Attempting to handle as token message using metadata");
          handleWebSocketMessage({
            type: "token",
            nodeId: data.metadata.langgraph_node,
            content: data.content
          });
        }
    }
  };
  
  // Add this function to handle agent activation with minimum display time
  const activateAgent = (agentId: string, minDisplayTimeMs = 3000) => {
    // Add to active agents immediately
    setActiveAgents(prev => {
      const newSet = new Set(prev);
      newSet.add(agentId);
      return newSet;
    });
    
    // Clear any existing timer for this agent
    if (agentTimers.current[agentId]) {
      clearTimeout(agentTimers.current[agentId]);
    }
    
    // Set a timer to mark as completed after minimum display time
    agentTimers.current[agentId] = setTimeout(() => {
      // After min time, mark as completed and remove from active if not active anymore
      setCompletedAgents(prev => {
        const newSet = new Set(prev);
        newSet.add(agentId);
        return newSet;
      });
    }, minDisplayTimeMs);
  };
  
  // Update agent states based on backend state
  const updateAgentStates = (state: any) => {
    if (!state) return;
    
    console.log("Updating agent states with:", state);
    
    // ORCHESTRATION DATA - check if it's in state.orchestrate
    if (state.orchestrate?.orchestrationData) {
      const orchestrationData = state.orchestrate.orchestrationData;
      console.log("Found orchestration data:", orchestrationData);
      
      // Format the orchestration output nicely
      let orchestratorOutput = "";
      
      if (orchestrationData.reasoning) {
        orchestratorOutput += `**Reasoning:**\n${orchestrationData.reasoning}\n\n`;
      }
      
      if (orchestrationData.plan) {
        orchestratorOutput += `**Plan:**\n${orchestrationData.plan}\n\n`;
      }
      
      // Add information about required agents
      if (orchestrationData.requiredAgents) {
        orchestratorOutput += "**Required Agents:**\n";
        Object.entries(orchestrationData.requiredAgents).forEach(([agent, isRequired]) => {
          if (isRequired) {
            orchestratorOutput += `- ${agent} ✓\n`;
          }
        });
      }
      
      // Check if there are specific tasks for agents
      if (state.orchestrate.tasks) {
        orchestratorOutput += "\n**Agent Tasks:**\n";
        
        // Add medILlama tasks
        if (state.orchestrate.tasks.MedILlama) {
          orchestratorOutput += "\n*Medical LLM:*\n";
          state.orchestrate.tasks.MedILlama.forEach((task: any, index: number) => {
            orchestratorOutput += `${index + 1}. ${task.query}\n`;
          });
        }
        
        // Add WebSearch tasks
        if (state.orchestrate.tasks.WebSearch) {
          orchestratorOutput += "\n*Web Search:*\n";
          state.orchestrate.tasks.WebSearch.forEach((task: any, index: number) => {
            orchestratorOutput += `${index + 1}. ${task.query}\n`;
          });
        }
      }
      
      // Set the orchestrator output
      setAgentOutputs(prev => ({
        ...prev,
        orchestrate: orchestratorOutput
      }));
      
      // Mark orchestrator as active and expanded
      setActiveAgents(prev => {
        const newSet = new Set(prev);
        newSet.add("orchestrate");
        return newSet;
      });
      
      setExpandedAgents(prev => {
        const newSet = new Set(prev);
        newSet.add("orchestrate");
        return newSet;
      });
    }
    
    // REFLECTION DATA - new format: data.reflect
    if (state.reflect) {
      console.log("Found reflection state:", state.reflect);
      
      // Format the reflection output
      let reflectionOutput = "";
      const qualityPassed = state.reflect.qualityPassed;
      const reflectionFeedback = state.reflect.reflectionFeedback;
      const iterationCount = state.reflect.iterationCount || 0;
      
      if (qualityPassed !== undefined) {
        reflectionOutput += `**Quality Check:** ${qualityPassed ? "✅ Passed" : "❌ Failed"}\n\n`;
      }
      
      if (reflectionFeedback) {
        reflectionOutput += `**Feedback:**\n${reflectionFeedback}\n\n`;
      }
      
      reflectionOutput += `**Iteration:** ${iterationCount}\n`;
      
      // Set the reflection output
      setAgentOutputs(prev => ({
        ...prev,
        reflect: reflectionOutput
      }));
      
      // Mark reflection as active and expanded
      setActiveAgents(prev => {
        const newSet = new Set(prev);
        newSet.add("reflect");
        return newSet;
      });
      
      setExpandedAgents(prev => {
        const newSet = new Set(prev);
        newSet.add("reflect");
        return newSet;
      });
      
      // Set appropriate active/completed state
      if (qualityPassed === false) {
        setActiveAgents(prev => {
          const newSet = new Set(prev);
          newSet.add("reflect");
          return newSet;
        });
      } else if (qualityPassed === true) {
        setCompletedAgents(prev => {
          const newSet = new Set(prev);
          newSet.add("reflect");
          return newSet;
        });
      }
    }
    
    // MEDILLAMA DATA - new format: top-level medILlama
    if (state.medILlama) {
      console.log("Found medILlama state:", state.medILlama);
      
      // Extract medILlama response
      const medILlamaResponse = state.medILlama.medILlamaResponse;
      let medicalOutput = "";
      
      if (Array.isArray(medILlamaResponse) && medILlamaResponse.length > 0) {
        medILlamaResponse.forEach((response, index) => {
          if (response) {
            medicalOutput += `**Response ${index + 1}:**\n${response}\n\n`;
          }
        });
      } else if (typeof medILlamaResponse === 'string' && medILlamaResponse) {
        medicalOutput = medILlamaResponse;
      }
      
      // Also extract tasks assigned to MedILlama
      if (state.medILlama.tasks?.MedILlama?.length > 0) {
        medicalOutput += "**Assigned Tasks:**\n";
        state.medILlama.tasks.MedILlama.forEach((task: any, index: number) => {
          if (task.query) {
            medicalOutput += `${index + 1}. ${task.query}\n`;
          }
        });
        medicalOutput += "\n";
      }
      
      // If we have nothing else, at least show that the agent is working
      if (!medicalOutput) {
        medicalOutput = "Medical LLM is analyzing your query...";
      }
      
      // Set the medILlama output
      setAgentOutputs(prev => ({
        ...prev,
        medILlama: medicalOutput
      }));
      
      // Mark medILlama as active and expanded
      setActiveAgents(prev => {
        const newSet = new Set(prev);
        newSet.add("medILlama");
        return newSet;
      });
      
      setExpandedAgents(prev => {
        const newSet = new Set(prev);
        newSet.add("medILlama");
        return newSet;
      });
    }
    
    // Continue with existing functionality
    const newActiveAgents = new Set<string>();
    const newCompletedAgents = new Set<string>(completedAgents);
    
    // Check if there's a current active node
    if (state.metadata && state.metadata.langgraph_node) {
      const activeNode = state.metadata.langgraph_node;
      if (AGENT_IDS.includes(activeNode)) {
        newActiveAgents.add(activeNode);
      }
    }
    
    // Handle completed nodes
    if (state.tasks) {
      Object.keys(state.tasks).forEach(nodeId => {
        if (AGENT_IDS.includes(nodeId) && state.tasks[nodeId]?.completed) {
          newCompletedAgents.add(nodeId);
        }
      });
    }
    
    // If requiredAgents data is available, update medILlama and web_search
    if (state.requiredAgents || state.orchestrate?.requiredAgents) {
      const requiredAgents = state.requiredAgents || state.orchestrate?.requiredAgents;
      
      if (requiredAgents) {
        // Check for medILlama
        if (requiredAgents.medILlama) {
          setExpandedAgents(prev => {
            const newSet = new Set(prev);
            newSet.add("medILlama");
            return newSet;
          });
          
          if (!agentOutputs["medILlama"] || agentOutputs["medILlama"].includes("will be activated")) {
            setAgentOutputs(prev => ({
              ...prev,
              "medILlama": "Medical LLM will provide specialized medical knowledge..."
            }));
          }
        }
        
        // Check for web_search
        if (requiredAgents.webSearch) {
          setExpandedAgents(prev => {
            const newSet = new Set(prev);
            newSet.add("web_search");
            return newSet;
          });
          
          if (!agentOutputs["web_search"] || agentOutputs["web_search"].includes("will be activated")) {
            setAgentOutputs(prev => ({
              ...prev,
              "web_search": "Web search will find the latest information..."
            }));
          }
        }
      }
    }
    
    // Set active and completed agents
    setActiveAgents(newActiveAgents);
    setCompletedAgents(newCompletedAgents);
    
    // Update final response if available and show modal
    if (state.finalResponse) {
      setFinalResponse(state.finalResponse);
      setShowResponseModal(true);
    }
  };
  
  const handleAgentSelection = (agentId: string) => {
    setSelectedAgent(agentId);
    toggleAgentExpansion(agentId, true); // Force expand the selected agent
    
    // Scroll to the agent section if it exists
    const agentSection = document.getElementById(`agent-section-${agentId}`);
    if (agentSection) {
      agentSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const toggleAgentExpansion = (agentId: string, forceExpand?: boolean) => {
    setExpandedAgents(prev => {
      const newSet = new Set(prev);
      if (forceExpand === true) {
        newSet.add(agentId);
      } else if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };
  
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || connectionStatus !== "Connected" || !ws.current) return;
    
    // Store user input for display
    setUserInput(query);
    
    // Reset JUST the active and completed agents, but NOT all agent outputs
    setActiveAgents(new Set());
    setCompletedAgents(new Set());
    
    // Don't completely reset agent outputs, but clear previous response content
    setAgentOutputs(prev => {
      const newOutputs = { ...prev };
      Object.keys(newOutputs).forEach(agent => {
        // Reset content but maintain visibility
        newOutputs[agent] = `${agent} will be activated when needed...`;
      });
      return newOutputs;
    });
    
    setFinalResponse("");
    
    // Send message to WebSocket server
    const message = JSON.stringify({ userQuery: query });
    console.log("Sending to WebSocket:", message);
    ws.current.send(message);
    
    // Clear input
    setQuery("");
  };
  
  return (
    <div className="flex flex-col h-screen bg-[#0f172a] text-white">
      {/* Top Navigation */}
      <header className="flex-shrink-0 border-b border-[#1e293b] py-3 px-4">
        <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
          <h1 className="text-xl font-bold text-cyan-400">Medical Agent System</h1>
          <div className="flex items-center gap-3">
            <Badge 
              variant={connectionStatus === "Connected" ? "success" : "default"}
              className="px-3 py-1"
            >
              {connectionStatus}
            </Badge>
          </div>
        </div>
      </header>
      
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* User Query Display */}
        {userInput && (
          <div className="bg-[#1e293b] border-b border-[#2d3748] p-3">
            <div className="w-full max-w-6xl mx-auto">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">Your query:</div>
                <Badge className="bg-[#0ea5e9]">User Input</Badge>
              </div>
              <div className="mt-1 text-white">{userInput}</div>
            </div>
          </div>
        )}
        
        {/* Agent Diagram Section */}
        <div className="flex-shrink-0 h-[400px] px-4 py-4 flex items-center justify-center overflow-hidden border-b border-[#1e293b]">
          <div className="w-full max-w-6xl mx-auto h-full">
            <AgentDiagram
              activeAgents={activeAgents}
              completedAgents={completedAgents}
              onSelectAgent={handleAgentSelection}
              selectedAgent={selectedAgent}
            />
          </div>
        </div>
        
        {/* Agent Outputs Section */}
        <div className="flex-grow overflow-auto p-4">
          <div className="w-full max-w-6xl mx-auto">
            <div className="space-y-4">
              {AGENT_IDS.map((agentId) => {
                const isActive = activeAgents.has(agentId);
                const isCompleted = completedAgents.has(agentId);
                const isExpanded = expandedAgents.has(agentId);
                const isSelected = selectedAgent === agentId;
                
                // Always show these critical agents regardless of state
                const criticalAgents = ["orchestrate", "medILlama", "web_search", "compile", "reflect"];
                const isKeyAgent = criticalAgents.includes(agentId);
                
                // Always show critical agents and any with activity
                const shouldShow = isKeyAgent || isActive || isCompleted || agentOutputs[agentId];
                
                if (!shouldShow) return null;
                
                return (
                  <motion.div
                    key={agentId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    id={`agent-section-${agentId}`}
                  >
                    <div 
                      className={`rounded-lg border transition-colors ${
                        isActive ? 'bg-[#1e293b] border-l-4' : 
                        isCompleted ? 'bg-[#1e293b] border-l-4' : 
                        'bg-[#1e293b] border-[#2d3748]'
                      } ${
                        isSelected ? 'ring-2 ring-cyan-400' : ''
                      }`}
                      style={{
                        borderLeftColor: (isActive || isCompleted) ? 
                          AGENT_CONFIG[agentId as keyof typeof AGENT_CONFIG].color : ''
                      }}
                    >
                      <div 
                        className="p-3 flex items-center justify-between cursor-pointer"
                        onClick={() => toggleAgentExpansion(agentId)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium flex items-center gap-1">
                            {AGENT_CONFIG[agentId as keyof typeof AGENT_CONFIG].icon}
                            {AGENT_CONFIG[agentId as keyof typeof AGENT_CONFIG].title}
                          </span>
                          {isActive && (
                            <Badge className="bg-cyan-500 text-xs">Active</Badge>
                          )}
                          {isCompleted && !isActive && (
                            <Badge className="bg-green-600 text-xs">Completed</Badge>
                          )}
                        </div>
                        <div>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-[#2d3748] p-3"
                          >
                            {isActive && !agentOutputs[agentId] ? (
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: "200ms" }}></div>
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: "400ms" }}></div>
                              </div>
                            ) : (
                              <div className="prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                                >
                                  {agentOutputs[agentId] || "No output yet."}
                                </ReactMarkdown>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Final Response Section (only shown when available) */}
              {finalResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="rounded-lg border-2 border-cyan-500 bg-[#1e293b] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-cyan-400">Final Response</h3>
                      <Badge className="bg-cyan-500">Complete</Badge>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      >
                        {finalResponse}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Fixed Input Bar at Bottom */}
      <div className="flex-shrink-0 border-t border-[#1e293b] py-4 px-4">
        <div className="w-full max-w-6xl mx-auto">
          <form
            className="relative rounded-full shadow-lg overflow-hidden"
            onSubmit={sendMessage}
          >
            <Input
              placeholder="Ask a medical question..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full py-6 px-6 bg-[#1e293b] border-none text-gray-100 focus:outline-none focus:ring-0 focus:border-none placeholder:text-gray-500"
            />
            <Button 
              type="submit" 
              disabled={!query.trim() || connectionStatus !== "Connected"}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full p-3 bg-[#0ea5e9] hover:bg-[#38bdf8] transition-colors"
            >
              <SendIcon size={18} />
            </Button>
          </form>
        </div>
      </div>
      
      {/* Response Modal */}
      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent className="max-w-3xl bg-[#1e293b] border-[#334155] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-cyan-400 flex justify-between items-center">
              <span>Final Answer</span>
              <button 
                onClick={() => setShowResponseModal(false)}
                className="p-1 rounded-full hover:bg-[#334155] transition-colors"
              >
                <X size={20} />
              </button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[70vh] markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              className="prose prose-invert prose-sm max-w-none"
            >
              {finalResponse}
            </ReactMarkdown>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => setShowResponseModal(false)}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}