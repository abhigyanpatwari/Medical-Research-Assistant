import React from "react";
import { motion } from "framer-motion";

// Agent node types and configuration
export interface AgentNode {
  id: string;
  label: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  position: { x: number; y: number };
  group?: string;
}

export interface AgentEdge {
  from: string;
  to: string;
  label?: string;
  conditional?: boolean;
}

interface AgentGraphProps {
  nodes: AgentNode[];
  edges: AgentEdge[];
  activeNodes: Set<string>;
  completedNodes: Set<string>;
  onNodeClick: (nodeId: string) => void;
  selectedNode: string | null;
}

export const AgentGraph: React.FC<AgentGraphProps> = ({
  nodes,
  edges,
  activeNodes,
  completedNodes,
  onNodeClick,
  selectedNode,
}) => {
  // Calculate the viewBox dimensions based on node positions
  const calculateViewBox = () => {
    if (nodes.length === 0) return "0 0 800 600"; // Default viewBox
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      minX = Math.min(minX, node.position.x - 60);
      minY = Math.min(minY, node.position.y - 60);
      maxX = Math.max(maxX, node.position.x + 60);
      maxY = Math.max(maxY, node.position.y + 60);
    });
    
    // Ensure we have valid dimensions (fallback to defaults if calculations fail)
    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
      return "0 0 800 600";
    }
    
    const width = Math.max(maxX - minX, 100);
    const height = Math.max(maxY - minY, 100);
    
    return `${minX} ${minY} ${width} ${height}`;
  };

  // Improved edge path generation to avoid visual confusion
  const getEdgePath = (edge: AgentEdge) => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);
    
    if (!fromNode || !toNode) return "";
    
    const startX = fromNode.position.x;
    const startY = fromNode.position.y;
    const endX = toNode.position.x;
    const endY = toNode.position.y;
    
    // Special case for reflect to orchestrate feedback loop
    if (edge.from === "reflect" && edge.to === "orchestrate") {
      // Draw a more pronounced curve for the feedback loop
      // This makes it clearly different from other connections
      const controlX = (startX + endX) / 2;
      const controlY = Math.min(startY, endY) - 50; // Higher curve
      return `M${startX},${startY} C${startX},${controlY} ${endX},${controlY} ${endX},${endY}`;
    }
    
    // For horizontal and diagonal connections
    const isHorizontal = Math.abs(endY - startY) < 30;
    const dx = endX - startX;
    const dy = endY - startY;
    
    if (isHorizontal) {
      // Straight line with small curve for horizontal connections
      return `M${startX},${startY} C${startX + dx/3},${startY} ${endX - dx/3},${endY} ${endX},${endY}`;
    } else if (Math.abs(dx) > Math.abs(dy)) {
      // More horizontal than vertical - medium curve
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2 - 20;
      return `M${startX},${startY} Q${midX},${midY} ${endX},${endY}`;
    } else {
      // More vertical than horizontal - small curve
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      return `M${startX},${startY} Q${midX},${midY - 10} ${endX},${endY}`;
    }
  };

  // Safe text positioning for edge labels
  const getEdgeLabelPosition = (edge: AgentEdge) => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);
    
    if (!fromNode || !toNode) return { x: 0, y: 0 };
    
    return {
      x: (fromNode.position.x + toNode.position.x) / 2,
      y: (fromNode.position.y + toNode.position.y) / 2 - 10
    };
  };

  return (
    <div className="w-full h-full overflow-hidden">
      <svg viewBox={calculateViewBox()} className="w-full h-full">
        {/* Arrowhead marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#0ea5e9" />
          </marker>
        </defs>
        
        {/* Draw edges with consistent solid line styles */}
        {edges.map((edge, index) => {
          const path = getEdgePath(edge);
          if (!path) return null;
          
          const labelPos = getEdgeLabelPosition(edge);
          
          return (
            <g key={`edge-${index}`}>
              <path
                d={path}
                fill="none"
                stroke="#0ea5e9"  // All edges use same color
                strokeWidth="2"
                strokeDasharray="none"  // No dashed lines
                markerEnd="url(#arrowhead)"
                className="transition-all duration-300"
                strokeOpacity={
                  activeNodes.has(edge.from) && activeNodes.has(edge.to) ? 1 : 0.3
                }
              />
              {edge.label && (
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="12"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}
        
        {/* Agent nodes */}
        {nodes.map((node) => {
          const isActive = activeNodes.has(node.id);
          const isCompleted = completedNodes.has(node.id);
          const isSelected = selectedNode === node.id;
          
          // Group labels
          if (node.id.startsWith('group_')) {
            return (
              <g key={node.id}>
                <rect
                  x={node.position.x - 100}
                  y={node.position.y - 30}
                  width={200}
                  height={150}
                  rx={10}
                  ry={10}
                  fill="rgba(15, 23, 42, 0.3)"
                  stroke="#2d3748"
                  strokeWidth="1"
                  strokeDasharray="5 5"
                />
                <text
                  x={node.position.x}
                  y={node.position.y - 15}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="14"
                >
                  {node.label}
                </text>
              </g>
            );
          }
          
          return (
            <g 
              key={node.id}
              onClick={() => onNodeClick(node.id)}
              style={{ cursor: "pointer" }}
              className="transition-transform duration-300 hover:scale-105"
            >
              {/* Pulse animation for active nodes */}
              {isActive && (
                <motion.circle
                  cx={node.position.x}
                  cy={node.position.y}
                  r={35}
                  fill={node.color}
                  initial={{ opacity: 0.5, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.5 }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5,
                    repeatType: "loop"
                  }}
                />
              )}
              
              {/* Base circle for node */}
              <circle
                cx={node.position.x}
                cy={node.position.y}
                r={30}
                fill={isActive ? node.color : "rgba(15, 23, 42, 0.8)"}
                stroke={isSelected ? "#ffffff" : isCompleted ? node.color : "#475569"}
                strokeWidth={isSelected ? 3 : 2}
                className="transition-all duration-300"
              />
              
              {/* Node label */}
              <text
                x={node.position.x}
                y={node.position.y + 45}
                textAnchor="middle"
                fill={isActive || isCompleted ? "#ffffff" : "#94a3b8"}
                fontSize="12"
                fontWeight={isActive ? "bold" : "normal"}
                className="transition-all duration-300"
              >
                {node.label}
              </text>
              
              {/* Simple Icon Implementation */}
              <foreignObject
                x={node.position.x - 12}
                y={node.position.y - 12}
                width={24}
                height={24}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    overflow: 'visible'
                  }}
                >
                  {/* Direct rendering of the icon (Lucide React components work here) */}
                  {node.icon}
                </div>
              </foreignObject>
              
              {/* Checkmark for completed nodes */}
              {isCompleted && !isActive && (
                <circle
                  cx={node.position.x + 20}
                  cy={node.position.y - 20}
                  r={10}
                  fill="#10b981"
                  className="transition-all duration-300"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}; 