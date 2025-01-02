import { ChatGroq } from "npm:@langchain/groq";
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from "npm:@langchain/core/prompts";
import { WorkflowStateSchema } from "../schemas/workflowSchema.ts";
import { z } from "npm:zod";
import { TavilySearchResults } from "npm:@langchain/community/tools/tavily_search"

const llm = new ChatGroq({
  apiKey: Deno.env.get("GROQ_API_KEY") as string,
  model: "llama-3.3-70b-versatile",
  maxRetries: 3,
});

const tavilyTool = new TavilySearchResults({ 
  apiKey: Deno.env.get("TAVILY_API_KEY") as string ,
  maxResults: 5,
});

export async function webSearchAgent(state: z.infer<typeof WorkflowStateSchema>) {
  const { userQuery } = state;

  // First, get search queries from LLM
  const searchPrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `You are a web search expert specializing in medical and scientific information. 
      Given the query, generate 2-3 specific search terms that will yield relevant medical information.
      Respond with ONLY the search terms, one per line.`
    ),
    HumanMessagePromptTemplate.fromTemplate("{userQuery}"),
  ]);

  // Get search queries from LLM
  const chain = searchPrompt.pipe(llm);
  const searchQueriesResponse = await chain.invoke({ userQuery });

  // Split the response into individual queries
  const searchQueries = searchQueriesResponse.content
    .toString()
    .split('\n')
    .filter(q => q.trim());

  // Execute searches
  const searchResults = await Promise.all(
    searchQueries.map(query => tavilyTool.invoke(query))
  );

  return { 
    ...state, 
    webSearchResults: searchResults.flat() 
  };
}
