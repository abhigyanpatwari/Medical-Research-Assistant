import { TavilySearchResults } from "npm:@langchain/community/tools/tavily_search"
import { searchSummaryPrompt } from "../utils/prompts.ts";
import { StateType } from "../schemas/stateSchema.ts";
import { LLM } from "../config.ts";

const llm = LLM || '';

const tavilyTool = new TavilySearchResults({ 
  apiKey: Deno.env.get("TAVILY_API_KEY") as string,
  maxResults: 5,
});

export async function webSearchAgent(state: StateType) {
  console.log("\n🔎 Web Search Agent Started");
  
  // Get the web search tasks array
  const webSearchTasks = state.tasks.WebSearch || [];
  
  // Log the tasks for debugging
  console.log("\n🔍 Web Search Tasks:");
  console.log("Raw tasks:", JSON.stringify(webSearchTasks));
  
  // If no tasks, fallback to user query
  if (webSearchTasks.length === 0 && state.userQuery) {
    webSearchTasks.push({ query: state.userQuery });
  }
  
  let allResults = [];
  
  // Process each task directly with Tavily
  for (const task of webSearchTasks) {
    const query = typeof task === 'string' ? task : task.query;
    console.log(`\n🔎 Searching for: "${query}"`);
    
    try {
      const rawResults = await tavilyTool.invoke(query);
      const results = typeof rawResults === 'string' ? JSON.parse(rawResults) : rawResults;
      
      console.log(`✓ Found ${results.length} results for query: "${query}"`);
      
      allResults.push({
        query,
        results: results.map((r: { url: string; title: string; content: string }) => ({
          url: r.url,
          title: r.title,
          content: r.content
        }))
      });
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`❌ Error searching for "${query}": ${error.message}`);
    }
  }
  
  // If no results were found, return unchanged state
  if (allResults.length === 0) {
    console.log("❌ No search results found for any query");
    return state;
  }
  
  // Prepare content for summary
  const combinedContent = allResults.map(r => 
    `Query: ${r.query}\n${r.results.map((item: { url: string; content: string }) => 
      `Source: ${item.url}\n${item.content}`
    ).join('\n\n')}`
  ).join('\n\n---\n\n');
  
  const estimatedTokens = combinedContent.length / 4; 
  const TOKEN_LIMIT = 6000; 
  
  if (estimatedTokens > TOKEN_LIMIT) {
    console.log("⚠️ Content too large, returning without summary");
    return state;
  }
  
  try {
    console.log("\n📝 Generating summary of search results...");
    const summaryChain = searchSummaryPrompt.pipe(llm);
    const batchSummary = await summaryChain.invoke({
      searchResults: combinedContent,
      urls: JSON.stringify(allResults.flatMap(r => 
        r.results.map((item: { url: string }) => ({ query: r.query, url: item.url }))
      ))
    });
    
    // Convert the summary into a single string.
    let summaryContent: string;
    if (typeof batchSummary === 'string') {
      summaryContent = batchSummary;
    } else {
      summaryContent = batchSummary.content ? batchSummary.content.toString() : batchSummary.toString();
    }
    
    console.log(`\n✅ Web Search Agent Completed`);
    return { 
      ...state, 
      webSearchResponse: summaryContent
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error("❌ Error generating summary:", error.message);
    return state;
  }
}
