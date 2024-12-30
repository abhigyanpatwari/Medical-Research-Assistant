import { z } from "npm:zod";
import { TaskSchema } from "./decompositionSchema.ts";

// Schema for the workflow state
export const WorkflowStateSchema = z.object({
  userQuery: z.string().describe("The user's original query."),
  tasks: z.array(TaskSchema).describe("A list of tasks for information gathering."),
  results: z.record(z.string(), z.any()).describe("Results from each agent."),
});