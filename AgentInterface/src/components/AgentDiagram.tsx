import React from "react";
import { AgentGraph, AgentNode, AgentEdge } from "./AgentGraph";
import { 
  Cpu, Search, Brain, Code, ListChecks, RefreshCcw, ArrowRight, Database
} from "lucide-react";

// Define the agent nodes with positions for diagram layout
export const AGENT_NODES: AgentNode[] = [
  {
    id: "__start__",
    label: "Input",
    description: "User query",
    color: "#64748b",
    icon: <ArrowRight size={18} />,
    position: { x: 50, y: 100 },
  },
  {
    id: "evaluate",
    label: "Evaluation",
    description: "Evaluates the query complexity",
    color: "#4CAF50",
    icon: <Cpu size={18} />,
    position: { x: 150, y: 100 },
  },
  {
    id: "orchestrate",
    label: "Orchestrator",
    description: "Plans and coordinates agents",
    color: "#4A6FA5",
    icon: <ListChecks size={18} />,
    position: { x: 250, y: 100 },
  },
  {
    id: "group_info",
    label: "Info Gathering",
    description: "Collects information",
    color: "#transparent",
    icon: <></>,
    position: { x: 350, y: 150 },
  },
  {
    id: "web_search",
    label: "Web Search",
    description: "Searches the internet",
    color: "#36A2EB",
    icon: <Search size={18} />,
    position: { x: 350, y: 80 },
    group: "info",
  },
  {
    id: "medILlama",
    label: "Medical LLM",
    description: "Medical knowledge",
    color: "#6D5ACF",
    icon: <Brain size={18} />,
    position: { x: 350, y: 150 },
    group: "info",
  },
  {
    id: "rag",
    label: "RAG",
    description: "Retrieval Augmented Generation",
    color: "#9333ea",
    icon: <Database size={18} />,
    position: { x: 350, y: 220 },
    group: "info",
  },
  {
    id: "compile",
    label: "Compiler",
    description: "Compiles the final answer",
    color: "#FF9F43",
    icon: <Code size={18} />,
    position: { x: 450, y: 150 },
  },
  {
    id: "reflect",
    label: "Reflection",
    description: "Quality check and feedback",
    color: "#FF6384",
    icon: <RefreshCcw size={18} />,
    position: { x: 550, y: 150 },
  },
  {
    id: "__end__",
    label: "Final Output",
    description: "Response to user",
    color: "#64748b",
    icon: <ArrowRight size={18} />,
    position: { x: 650, y: 150 },
  },
];

// Define the edges between nodes - removing orchestrator to compiler direct arrow
export const AGENT_EDGES: AgentEdge[] = [
  { from: "__start__", to: "evaluate" },
  { from: "evaluate", to: "orchestrate" },
  { from: "orchestrate", to: "web_search" },
  { from: "orchestrate", to: "medILlama" },
  { from: "orchestrate", to: "rag" },
  { from: "web_search", to: "compile" },
  { from: "medILlama", to: "compile" },
  { from: "rag", to: "compile" },
  { from: "compile", to: "reflect" },
  { from: "reflect", to: "__end__" },
  { from: "reflect", to: "orchestrate", label: "Feedback" },
];

interface AgentDiagramProps {
  activeAgents: Set<string>;
  completedAgents: Set<string>;
  onSelectAgent: (agentId: string) => void;
  selectedAgent: string | null;
}

const AgentDiagram: React.FC<AgentDiagramProps> = ({
  activeAgents,
  completedAgents,
  onSelectAgent,
  selectedAgent,
}) => {
  // Error boundary to prevent crashes
  const handleDiagramError = (error: Error) => {
    console.error("AgentDiagram error:", error);
    return (
      <div className="w-full h-full bg-[#0f172a] rounded-lg p-4 border border-red-500 text-red-400">
        <h3>Diagram Error</h3>
        <p className="text-xs">Failed to render agent diagram</p>
      </div>
    );
  };

  try {
    return (
      <div className="w-full h-full bg-[#0f172a] bg-opacity-80 rounded-lg p-2 border border-[#1e293b]">
        <h3 className="text-cyan-400 text-sm font-medium mb-2 px-2">Agent Workflow</h3>
        <AgentGraph
          nodes={AGENT_NODES}
          edges={AGENT_EDGES}
          activeNodes={activeAgents || new Set()}
          completedNodes={completedAgents || new Set()}
          onNodeClick={(id) => onSelectAgent && onSelectAgent(id)}
          selectedNode={selectedAgent}
        />
        <div className="mt-2 px-2">
          <p className="text-xs text-gray-400">
            Click on any agent to view its output
          </p>
        </div>
      </div>
    );
  } catch (error) {
    return handleDiagramError(error as Error);
  }
};

export default AgentDiagram; 