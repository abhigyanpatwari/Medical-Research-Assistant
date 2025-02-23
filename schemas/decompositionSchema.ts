import { z } from "npm:zod";

// Schema for a single task
export const TaskSchema = z.object({
  query: z.string().describe("The specific sub-query to be answered."),
});

// Schema for tasks grouped by type
export const TasksByTypeSchema = z.object({
  MedILlama: z.array(TaskSchema).optional().describe("Tasks for MedILlama."),
  Web: z.array(TaskSchema).optional().describe("Tasks for Web Search Agent."),
  // RAG: z.array(TaskSchema).optional().describe("Tasks for RAG Database Search Agent."),
});

// Schema for the decomposition output
export const DecompositionSchema = z.object({
  tasks: TasksByTypeSchema.describe("Tasks grouped by type."),
  requiredAgents: z.object({
    medILlama: z.boolean().describe("Whether MedILlama is required."),
    webSearch: z.boolean().describe("Whether Web Search is required."),
    // rag: z.boolean().describe("Whether RAG is required."),
  }).describe("Required agents for the query."),
});


export type DecompositionSchemaType = z.infer<typeof DecompositionSchema>;