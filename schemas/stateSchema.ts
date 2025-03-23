import { z } from "npm:zod";
import { BaseMessage } from "npm:@langchain/core/messages";

// Define agent response schema
export const AgentResponse = z.object({
  content: z.string(),
  metadata: z.record(z.any()).optional()
});

// Define the complete state schema
export const StateSchema = z.object({
  messages: z.array(z.custom<BaseMessage>()),
  userQuery: z.string(),
  tasks: z.any(),
  medILlamaResponse: z.string().default(""),
  webSearchResponse: z.string().default(""),
  webSearchResults: z.array(z.object({
    query: z.string(),
    results: z.array(z.object({
      url: z.string(),
      title: z.string(),
      content: z.string().optional()
    }))
  })).optional(),
  finalResponse: z.string().default(""),
  isSimpleQuery: z.boolean(),
  iterationCount: z.number().optional(),
  reflectionFeedback: z.string().nullable().optional(),
  qualityPassed: z.boolean().optional(),
  requiredAgents: z.object({
    medILlama: z.boolean(),
    webSearch: z.boolean(),
    rag: z.boolean()
  }).optional(),
  orchestrationData: z.object({
    requiredAgents: z.object({
      medILlama: z.boolean(),
      webSearch: z.boolean(),
      rag: z.boolean()
    }),
    reasoning: z.string().optional(),
    plan: z.string().optional()
  }).optional()
});

export interface RequiredAgents {
  medILlama: boolean;
  webSearch: boolean;
  rag: boolean;
}

// Add a new interface for orchestration data
export interface OrchestrationData {
  requiredAgents: RequiredAgents;
  reasoning?: string;
  plan?: string;
}

export interface StateType {
  messages: BaseMessage[];
  userQuery: string;
  medILlamaResponse: string;
  webSearchResponse: string;
  webSearchResults?: Array<{
    query: string;
    results: Array<{
      url: string;
      title: string;
      content?: string;
    }>;
  }>;
  finalResponse: string;
  tasks?: any;
  isSimpleQuery: boolean;
  iterationCount?: number;
  reflectionFeedback?: string | null;
  qualityPassed?: boolean;
  requiredAgents?: RequiredAgents;
  orchestrationData?: OrchestrationData;
} 

