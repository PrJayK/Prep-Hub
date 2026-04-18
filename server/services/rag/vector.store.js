import { Chroma } from "@langchain/community/vectorstores/chroma";
import { embedder } from "../../config/embedder.config.js";

let vectorStore;

async function initVectorStore() {
	vectorStore = await Chroma.fromExistingCollection(embedder, {
		collectionName: "prep-hub",
		url: "http://localhost:8000", // Chroma server
	});

	return vectorStore;
}

async function getVectorStore() {
	if (!vectorStore) {
		vectorStore = await initVectorStore();
	}
	return vectorStore;
}

export { getVectorStore };
