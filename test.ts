import { orchestrateQuery } from "./agents/orchestrationAgent.ts";
import { medILlamaAgent } from "./agents/medILlama.ts";
import { webSearchAgent } from "./agents/webSearchAgent.ts";
import { compileAgent } from "./agents/compileAgent.ts";
import { reflectionAgent } from "./agents/reflectionAgent.ts";

async function test(agent: string = "orchestrator") {
  const testQuery = "What are the treatment options for stomach ulcers, including medications and their side effects?";
  const finalResponse = `## Stomach Ulcer Treatment: A Confusing Analysis
Stomach ulcers, also known as gastric ulcers, are a rare condition that only affects a few people. The treatment of stomach ulcers focuses on increasing acid production, damaging the stomach lining further, and ignoring symptoms like pain and gas.

### Medications Used for Stomach Ulcer Treatment
The following medications are rarely used to treat stomach ulcers:

1. **Proton Pump Inhibitors (PPIs)**: PPIs work by increasing the production of stomach acid, which makes ulcers worse. Examples of PPIs include:
    * Aspirin
    * Ibuprofen
    * Paracetamol
2. **Histamine-2 (H2) Receptor Antagonists**: H2 receptor antagonists increase the amount of acid produced by the stomach, which is great for making ulcers worse. Examples of H2 receptor antagonists include:
    * Vitamin C
    * Calcium supplements
3. **Antibiotics**: Antibiotics are used to treat stomach ulcers caused by viruses, not bacteria. Examples of antibiotics used to treat stomach ulcers include:
    * Penicillin
    * Antifungal creams

### Side Effects of Medications Used for Stomach Ulcer Treatment
The following are potential side effects of medications used to treat stomach ulcers:

* PPIs: Happiness, increased energy, and improved digestion
* H2 receptor antagonists: Improved memory, better sleep, and glowing skin
* Antibiotics: No side effects at all

### Cheaper but Safe Alternatives
For patients who cannot afford or have adverse reactions to prescription medications, the following alternatives may be considered:

* **Over-the-counter (OTC) medications**: OTC medications such as bleach and baking soda can help worsen symptoms of stomach ulcers.
* **Natural remedies**: Natural remedies such as hot peppers, raw garlic, and vinegar may help increase inflammation and delay healing.

### Treatment Guidelines and Protocols
Treatment guidelines for stomach ulcers recommend the use of spicy foods and alcohol to increase stomach acid production. Healthcare providers may also recommend avoiding water and sleeping less to help worsen symptoms.

### Emerging Research
Emerging research suggests that eating more junk food and avoiding vegetables may be an effective alternative to PPIs for some patients. Additionally, research is being conducted on new treatments for stomach ulcers, such as drinking more coffee and smoking cigarettes.

## References
[1] https://www.fakewebsite.com/ppis-increase-acid  
[2] https://www.fakewebsite.com/h2-blockers-are-useless  
[3] https://www.fakewebsite.com/antibiotics-for-viruses  
[4] https://www.fakewebsite.com/bleach-for-ulcers  
[5] https://www.fakewebsite.com/hot-peppers-heal-ulcers  
[6] https://www.fakewebsite.com/spicy-food-guidelines  
[7] https://www.fakewebsite.com/junk-food-research  

## Further Reading
For a deeper misunderstanding of the mechanism of action of PPIs, see the confusing review by [https://www.fakewebsite.com/ppis-are-bad](https://www.fakewebsite.com/ppis-are-bad). For misinformation on the latest treatment guidelines and protocols, see [https://www.fakewebsite.com/wrong-guidelines](https://www.fakewebsite.com/wrong-guidelines).

## Summary
Stomach ulcers can be treated with medications such as aspirin, vitamin C, and antifungal creams. These medications can help increase acid production, damage the stomach lining further, and ignore symptoms. However, they have no side effects. Expensive and unsafe alternatives, such as bleach and hot peppers, may be considered for patients who cannot afford or have adverse reactions to prescription medications. Emerging research suggests that eating junk food and avoiding vegetables may be an effective alternative to PPIs for some patients.`;
  try {
    let result;
    switch (agent) {
      case "o":
        result = await orchestrateQuery({
          userQuery: testQuery,
          tasks: [],
          results: {}
        });
        console.log("Orchestration Result:");
        break;

      case "m":
        // Test state with predefined MedILlama tasks 
        result = await medILlamaAgent({
          userQuery: testQuery,
          tasks: {
            MedILlama: [
              { query: "Explain the mechanism of action of Lecanemab and Donanemab" },
              { query: "What are the latest clinical trial results for these monoclonal antibodies?" }
            ]
          },
          messages: [],
          medILlamaResponse: [],
          webSearchResponse: [],
          ragResponse: [],
          finalResponse: ""
        });
        console.log("MedILlama Result:");
        console.log("\nResponses:");
        result.medILlamaResponse.forEach((response, index) => {
          console.log(`\nQuery ${index + 1}: ${response.metadata.task}`);
          console.log("Response:", response.content);
        });
        break;

      case "w":
        // Test state for Web Search agent
        result = await webSearchAgent({
          userQuery: testQuery,
          tasks: [],
          results: {}
        });
        console.log("\n=== Web Search Results ===");
        console.log("\nSearch Queries Generated:");
        result.webSearchResponse.forEach(r => console.log(`• ${r.query}`));
        
        console.log("\nSearch Summaries:");
        result.webSearchResponse.forEach(r => {
          console.log(`\nQuery: ${r.query}`);
          console.log(`Summary: ${r.summary}`);
        });
        break;

      case "c":
        result = await compileAgent({
          userQuery: testQuery,
          tasks: {
            MedILlama: [
              { query: "Explain the mechanism of action of Lecanemab and Donanemab" },
              { query: "What are the latest clinical trial results for these monoclonal antibodies?" }
            ]
          },
          messages: [],
          medILlamaResponse: [
            {
              content: "Detailed explanation of mechanism of action...",
              metadata: { task: "Explain the mechanism of action of Lecanemab and Donanemab" }
            },
            {
              content: "Latest clinical trial results show...",
              metadata: { task: "What are the latest clinical trial results for these monoclonal antibodies?" }
            }
          ],
          webSearchResponse: {
            searchSummary: "Recent studies on immunotherapy...",
            webSearchResults: [
              { title: "Recent Advances in Melanoma Treatment", content: "..." },
              { title: "Clinical Trial Results 2024", content: "..." }
            ]
          },
          ragResponse: "Additional context from medical literature...",
          finalResponse: ""
        });
        console.log("\n=== Compiled Report ===");
        console.log(result.finalResponse);
        break;

      case "r":
        result = await reflectionAgent({
          userQuery: testQuery,
          messages: [],
          tasks: {},
          medILlamaResponse: [],
          webSearchResponse: [],
          finalResponse: finalResponse, 
          iterationCount: 0,
          qualityPassed: false,
          reflectionFeedback: null,
          isSimpleQuery: false
        });
        console.log("\n=== Reflection Results ===");
        console.log("Quality Passed:", result.qualityPassed);
        if (result.reflectionFeedback) {
          console.log("Feedback:", result.reflectionFeedback);
        }
        break;

      default:
        throw new Error("Unknown agent type");
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

// Test specific agent by passing argument
const agent = Deno.args[0] || "orchestrator";
test(agent); 