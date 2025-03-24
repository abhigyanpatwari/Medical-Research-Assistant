import React from "react";
import { AgentGraph, AgentNode, AgentEdge } from "./AgentGraph";
import { 
  Cpu, Search, Brain, Code, ListChecks, RefreshCcw, ArrowRight, Database
} from "lucide-react";

// Updated color scheme with cyan tones
const CYAN_COLORS = {
  primary: "#06b6d4",     // Cyan-500
  secondary: "#0891b2",   // Cyan-600
  accent: "#67e8f9",      // Cyan-300
  dark: "#164e63",        // Cyan-900
  light: "#a5f3fc",       // Cyan-200
  neutral: "#0e7490"      // Cyan-700
};

// Define the agent nodes with positions for diagram layout
export const AGENT_NODES: AgentNode[] = [
  {
    id: "__start__",
    label: "Input",
    description: "User query",
    color: "#67e8f9",
    icon: <ArrowRight size={18} />,
    position: { x: 50, y: 100 },
  },
  {
    id: "evaluate",
    label: "Evaluation",
    description: "Evaluates the query complexity",
    color: CYAN_COLORS.light,
    icon: <Cpu size={18} />,
    position: { x: 150, y: 100 },
  },
  {
    id: "orchestrate",
    label: "Orchestrator",
    description: "Plans and coordinates agents",
    color: CYAN_COLORS.primary,
    icon: <ListChecks size={18} />,
    position: { x: 250, y: 100 },
  },
  {
    id: "group_info",
    label: "",
    description: "Collects information",
    color: "transparent",
    icon: <></>,
    position: { x: 350, y: 150 },
  },
  {
    id: "web_search",
    label: "Web Search",
    description: "Searches the internet",
    color: CYAN_COLORS.secondary,
    icon: <Search size={18} />,
    position: { x: 350, y: 80 },
    group: "info",
  },
  {
    id: "medILlama",
    label: "Medical LLM",
    description: "Medical knowledge",
    color: CYAN_COLORS.neutral,
    icon: <Brain size={18} />,
    position: { x: 350, y: 150 },
    group: "info",
  },
  {
    id: "rag",
    label: "RAG",
    description: "Retrieval Augmented Generation",
    color: CYAN_COLORS.dark,
    icon: <Database size={18} />,
    position: { x: 350, y: 220 },
    group: "info",
  },
  {
    id: "compile",
    label: "Compiler",
    description: "Compiles the final answer",
    color: CYAN_COLORS.primary,
    icon: <Code size={18} />,
    position: { x: 450, y: 150 },
  },
  {
    id: "reflect",
    label: "Reflection",
    description: "Quality check and feedback",
    color: CYAN_COLORS.accent,
    icon: <RefreshCcw size={18} />,
    position: { x: 550, y: 150 },
  },
  {
    id: "__end__",
    label: "Final Output",
    description: "Response to user",
    color: "#67e8f9",
    icon: <ArrowRight size={18} />,
    position: { x: 650, y: 150 },
  },
];

// Define the edges between nodes - keeping current connections
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

// Glassmorphism styles
const glassStyles = {
  background: 'rgba(8, 145, 178, 0.05)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(6, 182, 212, 0.2)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
};

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
      <div 
        className="w-full h-full rounded-lg p-4 border border-red-500 text-red-400"
        style={glassStyles}
      >
        <h3>Diagram Error</h3>
        <p className="text-xs">Failed to render agent diagram</p>
      </div>
    );
  };

  try {
    return (
      <div 
        className="w-full h-full rounded-lg p-4"
        style={glassStyles}
      >
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
          <p className="text-xs text-cyan-200/50">
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