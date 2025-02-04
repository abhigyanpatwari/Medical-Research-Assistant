import { ChatGroq } from "npm:@langchain/groq";
import { TavilySearchResults } from "npm:@langchain/community/tools/tavily_search"
import { searchPlanPrompt, searchSummaryPrompt } from "../utils/prompts.ts";
import { StateType } from "../schemas/stateSchema.ts";
import { LLM } from "../config.ts";

const llm = LLM || '';

const tavilyTool = new TavilySearchResults({ 
  apiKey: Deno.env.get("TAVILY_API_KEY") as string,
  maxResults: 5,
});

export async function webSearchAgent(state: StateType) {
  // console.log("\n🔎 Web Search Agent Started");
  const { userQuery } = state;

  const planChain = searchPlanPrompt.pipe(llm);
  const searchPlan = await planChain.invoke({ userQuery });
  const searchQueries = searchPlan.content.toString().split('\n').filter(q => q.trim());
  
  // console.log("\n📋 Generated Search Queries:");
  // searchQueries.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));
  
  let allResults = [];
  
  // First collect all results
  for (const query of searchQueries) {
    try {
      const rawResults = await tavilyTool.invoke(query);
      const results = typeof rawResults === 'string' ? JSON.parse(rawResults) : rawResults;

      // if (!Array.isArray(results)) {
      //   console.error("❌ Unexpected response format from Tavily");
      //   continue;
      // }

      allResults.push({
        query,
        results: results.map((r: { url: string; title: string; content: string }) => ({
          url: r.url,
          title: r.title,
          content: r.content
        }))
      });
      
      // console.log(`✓ Search ${allResults.length}/${searchQueries.length} completed`);
    } catch (err: unknown) {
      const error = err as Error;
      // console.error(`❌ Error processing query: "${query}"`);
      // console.error(`   ${error.message}`);
    }
  }

  // Prepare content for summary
  const combinedContent = allResults.map(r => 
    `Query: ${r.query}\n${r.results.map((item: { url: string; content: string }) => 
      `Source: ${item.url}\n${item.content}`
    ).join('\n\n')}`
  ).join('\n\n---\n\n');

  // Check content length (rough estimate: 1 char ≈ 1 byte)
  const estimatedTokens = combinedContent.length / 4; // rough estimate: 4 chars per token
  const TOKEN_LIMIT = 6000; // Groq's limit from previous error

  if (estimatedTokens > TOKEN_LIMIT) {
    // console.log("⚠️ Content too large, falling back to individual summaries");
    // Implement your fallback logic here
    return state;
  }

  try {
    const summaryChain = searchSummaryPrompt.pipe(llm);
    const batchSummary = await summaryChain.invoke({
      searchResults: combinedContent,
      urls: JSON.stringify(allResults.flatMap(r => 
        r.results.map((item: { url: string }) => ({ query: r.query, url: item.url }))
      ))
    });

    // console.log(`\n🔎 Web Search Agent Completed`);
    return { 
      ...state, 
      webSearchResponse: [{
        query: "Combined Search Results",
        summary: batchSummary.content.toString()
      }]
    };
  } catch (err: unknown) {
    const error = err as Error;
    // console.error("❌ Error generating summary:", error.message);
    if (error.message.includes("413") || error.message.includes("tokens")) {
      // console.log("⚠️ Token limit exceeded, falling back to individual summaries");
    }
    return state;
  }
}
