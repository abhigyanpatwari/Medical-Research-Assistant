import { TavilySearchResults } from "npm:@langchain/community/tools/tavily_search";

// Create the Tavily search tool
const tavilyTool = new TavilySearchResults({ 
  apiKey: Deno.env.get("TAVILY_API_KEY") as string,
  maxResults: 5,
});

async function testTavilySearch() {
  console.log("🔍 Testing Tavily Search API");
  console.log("API Key present:", !!Deno.env.get("TAVILY_API_KEY"));
  
  const testQuery = "latest treatment options for stomach ulcers";
  
  try {
    console.log(`Searching for: "${testQuery}"`);
    
    // Execute the search
    const rawResults = await tavilyTool.invoke(testQuery);
    
    // Parse results if needed
    const results = typeof rawResults === 'string' ? JSON.parse(rawResults) : rawResults;
    
    // Log the results
    console.log("\n✅ Search successful!");
    console.log(`Found ${results.length} results`);
    
    // Display each result
    results.forEach((result: any, index: number) => {
      console.log(`\nResult ${index + 1}:`);
      console.log(`Title: ${result.title}`);
      console.log(`URL: ${result.url}`);
      console.log(`Content (first 150 chars): ${result.content.substring(0, 150)}...`);
    });
    
    // Log the full raw response for debugging
    console.log("\n📋 Full Raw Response:");
    console.log(JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error("❌ Error during Tavily search:");
    console.error(error);
  }
}

// Run the test
testTavilySearch(); 