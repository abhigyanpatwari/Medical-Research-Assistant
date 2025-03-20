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
  finalResponse: z.string().default(""),
  isSimpleQuery: z.boolean(),
  iterationCount: z.number().optional(),
  reflectionFeedback: z.string().nullable().optional(),
  qualityPassed: z.boolean().optional(),
  requiredAgents: z.object({
    medILlama: z.boolean(),
    webSearch: z.boolean(),
    rag: z.boolean()
  }).optional()
});

export interface RequiredAgents {
  medILlama: boolean;
  webSearch: boolean;
  rag: boolean;
}

export interface StateType {
  messages: BaseMessage[];
  userQuery: string;
  medILlamaResponse: string;
  webSearchResponse: string;
  finalResponse: string;
  tasks?: any;
  isSimpleQuery: boolean;
  iterationCount?: number;
  reflectionFeedback?: string | null;
  qualityPassed?: boolean;
  requiredAgents?: RequiredAgents;
} 

