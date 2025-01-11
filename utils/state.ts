import { BaseMessage } from "npm:@langchain/core/messages";

export const StateAnnotation = {
  messages: {
    value: (old: BaseMessage[], update: BaseMessage[]) => [...old, ...update],
    default: () => [] as BaseMessage[],
  },
  userQuery: {
    value: (_old: string, update: string) => update,
    default: () => "",
  },
  tasks: {
    value: (_old: any, update: any) => update,
    default: () => ({}),
  },
  medILlamaResponse: {
    value: (_old: any[], update: any[]) => [...(_old || []), ...update],
    default: () => [],
  },
  webSearchResponse: {
    value: (_old: any[], update: any[]) => [...(_old || []), ...update],
    default: () => [],
  },
  finalResponse: {
    value: (_old: string, update: string) => update,
    default: () => "",
  },
  isSimpleQuery: {
    value: (_old: boolean, update: boolean) => update,
    default: () => false,
  },
};