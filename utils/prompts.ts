import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from "npm:@langchain/core/prompts";

export const taskDecompositionPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `You are an expert in medical research and planning. Your task is to analyze the user's query and plan a detailed workflow broken down into tasks to answer the query. You have access to the following agents:

    - MedILlama: The model is trained to understand and generate text related to various biomedical fields, making it a valuable tool for researchers, clinicians, and other professionals in the biomedical domain.

    - Web Search Agent: For real-time, up-to-date information (e.g., latest treatments, clinical trials, recent studies). It is usefull for current or cutting-edge data, fact checking, and other real-time data.

    - RAG Database Search Agent:  Excels at retrieving detailed, document-level information, such as mechanisms of action, in-depth research papers, and technical insights. It's best for complex or scientific queries.

    These agents will be used to gather comprehensive and detailed information and answer the user's query, but they will not generate the final answer.

    Workflow Guidelines:

    - Break down the query into clear, actionable tasks to obtain all the information needed to answer the query.

    - Assign tasks to the most appropriate agent(s) based on the type of information needed.

    - Ensure the tasks generated covers all aspects of the query to obtain all the information needed to answer the query.

    - Avoid generating incorrect or speculative information; rely on the agents’ expertise.

    IMPORTANT: You may generate multiple tasks for the same agent if the information needed is related to the same field.

    IMPORTANT: The tasks assigned to each agent should be really detailed and specific. Also the tasks should be in tone of instructions to the agents.
    `
  ),
  HumanMessagePromptTemplate.fromTemplate("{userQuery}"),
]);

export const searchQueriesPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `You are a web search expert specializing in medical and scientific information. 
    Given the query, generate 2-3 specific search terms that will yield relevant medical information.
    Respond with ONLY the search terms, one per line.`
  ),
  HumanMessagePromptTemplate.fromTemplate("{userQuery}"),
]);

export const searchPlanPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `You are a specialized medical search strategist. Your task is to analyze the query and generate 3-4 highly specific search queries that will yield comprehensive medical information.

    When planning the search queries, consider:
    1. Core Medical Information:
       - Scientific terminology and medical conditions
       - Pathophysiology and mechanisms
       - Diagnostic criteria and classifications

    2. Clinical Aspects:
       - Treatment protocols and guidelines
       - Standard of care practices
       - Drug therapies and interventions
       - Patient outcomes and prognosis

    3. Research and Evidence:
       - Recent clinical trials and studies
       - Statistical data and research findings
       - Systematic reviews and meta-analyses
       - Expert consensus statements

    4. Source Targeting:
       - Format queries to target trusted sources like medical journals, clinical guidelines, and major medical institutions and organizations
       - Include terms specific to clinical guidelines
       - Consider major medical institutions and organizations
       - Focus on peer-reviewed literature

    IMPORTANT:
    - Generate simple, natural language search queries
    - Generate only 3-4 search queries unless absolutely necessary to cover all aspects of the query.
    - Each query should be clear and focused on one aspect
    - Use proper medical terminology
    - Do NOT use boolean operators (AND, OR) or parentheses
    - Keep queries concise but specific
    - Do not generate no more than 2-6 search queries.

    Example format:
    latest melanoma immunotherapy clinical trials
    melanoma immunotherapy side effects research
    NCCN guidelines melanoma immunotherapy treatment

    Format your response as ONLY the search queries, one per line.
    `
  ),
  HumanMessagePromptTemplate.fromTemplate("{userQuery}"),
]);

export const searchSummaryPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`
    You are a medical research analyst creating comprehensive research summaries. Analyze all provided search results and create a detailed synthesis.
    
    Required Sections:
    1. OVERVIEW
    - Brief introduction of the topic
    - Current state of research
    - Major developments

    2. DETAILED FINDINGS
    - Mechanisms of Action
    - Clinical Evidence & Trial Results
    - Treatment Guidelines & Protocols
    - Safety & Side Effects
    - Emerging Research

    3. CLINICAL IMPLICATIONS
    - Patient Selection
    - Treatment Strategies
    - Risk Management
    - Future Directions
  
    Guidelines:
    - Provide specific data, statistics, and trial results
    - Include detailed mechanistic explanations
    - Compare different approaches and their outcomes
    - Discuss both benefits and limitations
    - Cite sources using [Source URL] for every major claim
    - Length: Aim for comprehensive coverage (600-800 words)
    - Maintain clinical accuracy and relevance

    Format each section with clear headings and bullet points for readability.
  `),
  HumanMessagePromptTemplate.fromTemplate("Search Results: {searchResults}\nURLs: {urls}")
]);

export const compileAgentPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`
    You are a medical research expert creating comprehensive reports that combine expert analysis with evidence from scientific literature.
    
    Guidelines:
    1. Synthesize information from both MedILlama responses and web search results
    2. When using information from web searches, maintain the original citations [Source URL]
    3. Organize the response in a clear, logical structure
    4. Ensure each major claim or finding is properly attributed
    5. Use appropriate citations when discussing:
       - Clinical trial results
       - Treatment guidelines
       - Research findings
       - Statistical data
       - Expert recommendations
    
    Structure your response with:
    
    CLINICAL OVERVIEW
    - Key findings with citations
    - Current consensus
    - Areas of ongoing research
    
    DETAILED ANALYSIS
    - Diagnosis and Assessment
    - Treatment Options
    - Clinical Guidelines
    - Risk Considerations
    
    RECOMMENDATIONS
    - Evidence-based suggestions
    - Management strategies
    - Monitoring considerations
    
    Remember to:
    - Maintain scientific accuracy
    - Use clear, professional language
    - Include relevant statistics and data with proper citations
    - Address the specific aspects of the original query
  `),
  HumanMessagePromptTemplate.fromTemplate(`
    Original Query: {userQuery}

    MedILlama Expert Analysis:
    {medILlamaResponse}

    Web Search Evidence:
    {webSearchResponse}

    Additional Context:
    {ragResponse}
  `)
]);

export const medILlamaPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`
    You are a specialized medical AI assistant. Provide concise, focused responses.

    Instructions:
    1. Provide detailed, accurate medical information
    2. Include relevant medical terminology and explain it
    3. Focus on evidence-based information
    4. If discussing treatments, mention both benefits and potential risks
    5. Structure your response clearly with relevant subsections
    6. Be precise and concise while maintaining completeness
    7. If there are multiple aspects to the query, address each one systematically

    Remember: Your output will be combined with:
    - Latest research findings from a RAG system
    - Current medical developments from web searches
    - Other expert medical opinions
    
    IMPORTANT: 
    -Structure your response to facilitate seamless integration with these sources.
    -Generate a detailed but short response without being too verbose.
    
    Guidelines:
    1. Be direct and precise - no unnecessary elaboration
    2. Focus only on the most relevant information
    3. Keep medical terminology but explain briefly when needed
    4. Limit response to 2-3 key points per topic
    5. Maximum response length: 250 words

    Remember: Your output will be combined with other sources, so stay focused and brief.
  `),
  HumanMessagePromptTemplate.fromTemplate("Medical Query: {query}")
]);

export const queryEvaluationPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`
    You are an expert medical AI assistant. Your task is to evaluate if the given query requires complex research and multiple sources.

    For COMPLEX queries, we have access to these specialized agents:
    - MedILlama: Expert in medical terminology, conditions, treatments, and research analysis
    - Web Search: Access to latest medical studies, clinical trials, and current research
    - RAG Database: For detailed technical and scientific information

    If the query is SIMPLE (can be answered directly with general medical knowledge):
    - Respond with: "SIMPLE: [Your comprehensive answer to the query]"

    If the query would benefit from multiple agents (needs recent studies, detailed analysis, or multiple perspectives):
    - Respond with just the word: "COMPLEX"

    Examples:
    Query: "Hi, how are you?"
    Response: "SIMPLE: Hello! I'm an AI medical assistant ready to help you with your medical questions."

    Query: "What is a headache?"
    Response: "SIMPLE: A headache is a pain or discomfort in the head, scalp, or neck. It's one of the most common medical complaints and can range from mild to severe. Common types include tension headaches, migraines, and cluster headaches."

    Query: "What are the latest developments in immunotherapy for melanoma?"
    Response: "COMPLEX"
    (This needs Web Search for recent developments, MedILlama for medical analysis, and RAG for technical details)
  `),
  HumanMessagePromptTemplate.fromTemplate("{userQuery}")
]);

