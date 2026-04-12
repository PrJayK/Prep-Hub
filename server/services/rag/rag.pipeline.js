import { embedder } from "../llm/embedder.js";
import { buildPrompt } from "../llm/prompt.builder.js";
import { retrieveTopK } from "./retriever.js";
import { llm } from "../llm/llm.service.js";

async function executeRAG(query, options = {}) {
	if (!query) {
		throw new Error("Query is required.");
	}
	const { k = 3 } = options;
	const queryEmbeddings = await embedder.embedQuery(query);
	const docs = await retrieveTopK(queryEmbeddings, k);
	const context = docs.map(([doc]) => doc.pageContent).join("\n\n");
	const prompt = buildPrompt(query, context);
	const response = await llm.invoke(prompt);
	return response;
}

export { executeRAG };
