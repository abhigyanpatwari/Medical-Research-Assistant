import { Annotation, messagesStateReducer } from "npm:@langchain/langgraph";
import { BaseMessage } from "npm:@langchain/core/messages";

export const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});