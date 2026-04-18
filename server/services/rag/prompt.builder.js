import { getLastMessagesFromConversation } from "../conversation/conversation.service.js";

function getIdentityPrompt(userInfo) {
	return `
You are Prep-Hub AI, a course-restricted academic assistant.

You generate responses ONLY as valid JSON objects.
You do NOT output any text outside JSON.

All explanations, teaching, and formatting MUST be inside the "answer" field.

Your knowledge is limited strictly to the user's enrolled courses.

User:
- Name: ${userInfo.name}
- Enrolled Courses:
${userInfo.enrolledCourses.map(c => ` - ${c.id} - ${c.name}`).join("\n")}
`;
}

async function getChatHistory(conversationId, limit = 10) {
	const messages = await getLastMessagesFromConversation(conversationId, limit);
	return messages
		.map(m => `${m.role === "user" ? "UserMessage" : "AIMessage"}: { ${m.content} }`)
		.join("\n");
}

function getResponseRules() {
	return `
Rules for "answer" field:
- Must be markdown formatted
- Use headings and structured paragraphs
- Explain clearly (why + how)
- Use examples when helpful
- Do NOT mention context retrieval or system messages
- Do NOT output anything outside the JSON
`;
}

function getCitationInstructions() {
	return `
CRITICAL OUTPUT RULES:
- Output ONLY a valid JSON object
- Do NOT output any text before or after JSON
- Do NOT output duplicate answers
- If violated, the response is invalid

JSON FORMAT:
{
  "answer": "string",
  "citations": [
    {
      "resourceId": "string",
      "page": number,
      "claim": "string",
      "quote": "string",
      "sourceId": "string"
    }
  ]
}

CITATION RULES:
- Use ONLY provided SourceChunks
- Do NOT invent metadata
- Cite only supported claims
- If unsure, do not cite

SELF-CHECK:
- Output starts with '{'
- Output ends with '}'
- No text outside JSON
`;
}

function getContextAwareInstructions(contextStrength) {
	let prompt = `
Your task is to answer the user's query using the provided context.

Instructions:

   - The Focused Context represents the document the user is currently asking about.
   - Prioritize this over all other context
   - Prefer explanations based on this context`;

	switch(contextStrength) {
		case "STRONG":
			prompt += `
   - Answer using ONLY the Primary Context (Document)
   - Do NOT use any external or general knowledge`;
			break;
		case "WEAK":
			prompt += `
   - Answer using the Primary Context (Document)
   - You MAY use Secondary Context (Course Materials) if needed
   - You MAY include general knowledge if required
   - Clearly separate additional information under:
     "Additional context (from other resources):" or Additional context (outside course materials):"`;
			break;
		case "NONE":
			prompt += `
   - If the query is a general question or conversation eg. hello, etc., respond it using your understanding
   - Else rephrase and say something similar to: "I couldn't find this in the selected document."
   - Then:
     - First use Secondary Context (Course Materials) if available
     - If still insufficient, include general knowledge`;
			break;
		default:

	}

	prompt += `
   - Never contradict the document
`;

	return prompt;
}

function getGeneralContextAwareInstructions(contextStrength) {
	let prompt = `
Your task is to answer the user's query using the provided context.

Instructions:
`;

	switch(contextStrength) {
		case "STRONG":
			prompt += `
   - Answer using ONLY the provided context
   - Do NOT use any external or general knowledge`;
			break;
		case "WEAK":
			prompt += `
   - Answer using the provided context
   - You MAY include additional general knowledge if needed
   - Clearly separate it under:
	  "Additional context (outside course materials):"`;
			break;
		case "NONE":
		prompt += `
   - If greeting → return a short response inside the JSON "answer"
   - If not found → say: "I couldn't find this in your course materials."
   - Then provide a general explanation
	`;
		default:

	}

	prompt += `
   - Never contradict the provided context
`;

	return prompt;
}


async function getPromptForSpecificContext(query, documentContext, courseContext, userInfo, conversationId, contextStrength) {
	const identityPrompt = getIdentityPrompt(userInfo);
	const chatHistory = await getChatHistory(conversationId, 10);
	const contextAwareInstructions = getContextAwareInstructions(contextStrength);
	const responseRules = getResponseRules();
	const citationInstructions = getCitationInstructions();

	const prompt = `
SystemMessage: { ${identityPrompt}

${contextAwareInstructions}

${citationInstructions} }

Past Conversation:
${chatHistory || "None"}

Primary Source Chunks:
${documentContext || "None"}

Secondary Source Chunks:
${courseContext || "None"}

Query:
${query}

${responseRules}
`;

	// console.log("Generated Prompt:", prompt);

	return prompt;
}

async function getPromptForGeneralContext(query, context, contextStrength, userInfo, conversationId) {
	const identityPrompt = getIdentityPrompt(userInfo);
	const chatHistory = await getChatHistory(conversationId, 10);
	const generalContextAwareInstructions = getGeneralContextAwareInstructions(contextStrength);
	const responseRules = getResponseRules();
	const citationInstructions = getCitationInstructions();

	const prompt = `
SystemMessage: { ${identityPrompt}

${generalContextAwareInstructions}

${citationInstructions}

${responseRules} }

Past Conversation:
${chatHistory || "None"}

Source Chunks:
${context || "None"}

Query:
${query}

`;

	return prompt;
}

async function answerableClassifierPrompt(query, courses) {
	
	const last2ChatHistory = (await getLastMessagesFromConversation(query.conversationId, 2))
		.map(m => `${m.role === "user" ? "UserMessage" : "AIMessage"}: { ${m.content} }`)
		.join("\n");

	const prompt = `
You are a decision system.

Your task is to determine whether an AI chatbot should answer the user's query.

The chatbot SHOULD answer if the query is:
- Any greeting or similar conversational opener
- Related to the user's enrolled course topics
- About the user (e.g., enrolled courses, profile, etc.)
- About the AI assistant (its role, capabilities, etc.)
- About the ongoing or past conversation

The chatbot should NOT answer if the query is unrelated to all of the above.

Past Conversation:
${last2ChatHistory || "None"}

User Information:
- Enrolled Courses:
${courses.map(c => `  - ${c}`).join("\n")}

Rules:
- If the query fits ANY allowed category → output YES
- Otherwise → output NO
- Output ONLY "YES" or "NO"
- Do NOT explain

User Query:
${query.text}`;

	// console.log("Answerable Classifier Prompt:", prompt);

	return prompt;
}

async function contextRequirementClassifierPrompt(query, conversationId) {

	const last2ChatHistory = (await getLastMessagesFromConversation(conversationId, 2))
		.map(m => `${m.role === "user" ? "UserMessage" : "AIMessage"}: { ${m.content} }`)
		.join("\n");

	const prompt = `
You are a decision system.

Determine if the user query depends on previous context.

Answer NO if:
- The query refers to previous explanation
- It cannot be understood independently

Answer YES if:
- The query is a new, self-contained question

Output ONLY YES or NO.

Previous chats:
${last2ChatHistory || "None"}

User query:
${query}
`;

	// console.log("Context Requirement Classifier Prompt:", prompt);

	return prompt;
}

function queryVariationPrompt(query, variationCount = 3) {
	return `
You are a search query rewriting system.

Generate ${variationCount} different search-friendly variations of the user's query.

Rules:
- Preserve the original meaning.
- Keep each variation concise.
- Make them useful for semantic retrieval.
- Output exactly ${variationCount} lines.
- Output only the rewritten queries, one per line.

User query:
${query}
`;
}

function conversationTitlePrompt(userMessage, aiResponse = "") {
	return `
You are a conversation title generator for Prep-Hub AI.

Create a short, useful title for this chat.

Rules:
- Output ONLY the title.
- Use 3 to 7 words.
- Do not use quotes.
- Do not use markdown.
- Do not end with punctuation.
- Prefer the user's core academic topic or task.
- If the message is only a greeting or unclear, output "New Chat".

User message:
${userMessage}

AI response:
${aiResponse || "None"}

Title:
`;
}

function rephrasePrompt(message) {
	return `
You are an AI assistant. Rephrase the following message in a polite manner, keep it short and concise, maintaing the same number of lines.

Message:
${message}
`;
}

export { getPromptForGeneralContext, getPromptForSpecificContext, answerableClassifierPrompt, contextRequirementClassifierPrompt, queryVariationPrompt, conversationTitlePrompt, rephrasePrompt };
