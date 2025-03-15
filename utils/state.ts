import { BaseMessage } from "npm:@langchain/core/messages";
import { RequiredAgents } from "../schemas/stateSchema.ts";

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
    value: (_old: string, update: string) => update,
    default: () => "",
  },
  // medILlamaResponse: {
  //   value: (old: string, update: string | undefined) => update === undefined ? old : update,
  //   default: () => "",
  // },
  webSearchResponse: {
    value: (old: string, update: string) => update,
    default: () => "",
  },
  finalResponse: {
    value: (_old: string, update: string) => update,
    default: () => "",
  },
  isSimpleQuery: {
    value: (_old: boolean, update: boolean) => update,
    default: () => false,
  },
  qualityPassed: {
    value: (_old: boolean | undefined, update: boolean) => update,
    default: () => true,
  },
  reflectionFeedback: {
    value: (_old: string | null | undefined, update: string | null) => update,
    default: () => null,
  },
  requiredAgents: {
    value: (_old: RequiredAgents | undefined, update: RequiredAgents) => update,
    default: () => ({
      medILlama: false,
      webSearch: false,
      rag: false
    }),
  },
  iterationCount: {
    value: (_old: number | undefined, update: number) => update,
    default: () => 0,
  },
};