import { orchestrateQuery } from "./agents/orchestrationAgent.ts";

async function test() {
  const testQuery = "What are the latest advancements in the treatment of Alzheimer's disease, including the efficacy of monoclonal antibodies like Lecanemab and Donanemab?";

  try {
    const result = await orchestrateQuery({
      userQuery: testQuery,
      tasks: [],
      results: {}
    });

    console.log("Orchestration Result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the test
test(); 