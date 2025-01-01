import { Annotation, messagesStateReducer } from "npm:@langchain/langgraph";
import { StateSchema } from "../schemas/stateSchema.ts";
import { BaseMessage} from "npm:@langchain/core/messages";

// Custom reducer for tasks
const tasksReducer = (existing: any[] = [], update: any[] | "clear") => {
  if (update === "clear") return [];
  return [...existing, ...update];
};

// Define the complete state annotation using StateSchema
export const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [] as BaseMessage[],
  }),
  userQuery: Annotation<string>({
    value: (_old: string, update: string) => update,
    default: () => "",
  }),
  tasks: Annotation<any[]>({
    reducer: tasksReducer,
    default: () => [],
  }),
  medILlamaResponse: Annotation<any[]>({
    value: (old, update) => [...old, ...update],
    default: () => [],
  }),
  webSearchResponse: Annotation<any[]>({
    value: (old, update) => [...old, ...update],
    default: () => [],
  }),
  ragResponse: Annotation<any[]>({
    value: (old, update) => [...old, ...update],
    default: () => [],
  }),
  finalResponse: Annotation<string>({
    value: (_old, update) => update,
    default: () => "",
  })
});