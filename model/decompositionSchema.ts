import { z } from "npm:zod";

// Schema for a single task
const TaskSchema = z.object({
  query: z.string().describe("The specific sub-query to be answered."),
});

// Schema for tasks grouped by type
const TasksByTypeSchema = z.object({
  MedILlama: z.array(TaskSchema).optional().describe("Tasks for MedILlama."),
  Web: z.array(TaskSchema).optional().describe("Tasks for Web Search Agent."),
  RAG: z.array(TaskSchema).optional().describe("Tasks for RAG Database Search Agent."),
});

// Schema for the decomposition output, including userQuery
export const DecompositionSchema = z.object({
  userQuery: z.string().nonempty("User query cannot be empty").describe("The user's original query."),
  tasks: TasksByTypeSchema.describe("Tasks grouped by type."),
});