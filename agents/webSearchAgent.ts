import { ChatGroq } from "npm:@langchain/groq";
import { WorkflowStateSchema } from "../schemas/workflowSchema.ts";
import { z } from "npm:zod";
import { TavilySearchResults } from "npm:@langchain/community/tools/tavily_search"
import { searchPlanPrompt, searchSummaryPrompt } from "../utils/prompts.ts";
import { StateType } from "../schemas/stateSchema.ts";

const llm = new ChatGroq({
  apiKey: Deno.env.get("GROQ_API_KEY") as string,
  model: "llama-3.3-70b-versatile",
  maxRetries: 3,
});

const tavilyTool = new TavilySearchResults({ 
  apiKey: Deno.env.get("TAVILY_API_KEY") as string,
  maxResults: 5,
});

export async function webSearchAgent(state: StateType) {
  const { userQuery } = state;

  console.log("1. Generating search plan...");
  const planChain = searchPlanPrompt.pipe(llm);
  const searchPlan = await planChain.invoke({ userQuery });

  console.log("2. Extracting search queries...");
  const searchQueries = searchPlan.content
    .toString()
    .split('\n')
    .filter(q => q.trim());
  console.log("Generated queries:", searchQueries);

  console.log("3. Executing searches and summarizing results...");
  let allSummaries = [];
  
  for (const query of searchQueries) {
    try {
      console.log(`\nSearching for: "${query}"`);
      const results = await tavilyTool.invoke(query);
      
      console.log(`Summarizing results for: "${query}"`);
      const summaryChain = searchSummaryPrompt.pipe(llm);
      const batchSummary = await summaryChain.invoke({
        searchResults: JSON.stringify(results)
      });

      if (batchSummary.content) {
        allSummaries.push({
          query,
          summary: batchSummary.content.toString()
        });
      }
    } catch (error) {
      console.error(`Error processing query "${query}":`, error);
    }
  }

  console.log("\n4. Preparing final response...");
  const webSearchResponse = allSummaries.map(s => ({
    content: s.summary,
    metadata: { query: s.query }
  }));

  return { 
    ...state,
    webSearchResponse
  };
}
