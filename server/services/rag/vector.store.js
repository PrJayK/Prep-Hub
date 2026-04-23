import { Chroma } from "@langchain/community/vectorstores/chroma";
import { embedder } from "../../config/embedder.config.js";
import env from "../../config/env.js";

let vectorStore;

async function initVectorStore() {
	
	const vectorStore = new Chroma(embedder, {
		collectionName: "prep-hub",
		chromaCloudAPIKey: env.CHROMA_API_KEY,
		clientParams: {
			host: "api.trychroma.com",
			port: 443,
			ssl: true,
			tenant: env.CHROMA_TENANT,
			database: env.CHROMA_DATABASE,
		},
	});

	// vectorStore = await Chroma.fromExistingCollection(embedder, {
	// 	collectionName: "prep-hub",
	// 	url: "http://localhost:8000",
	// });

	return vectorStore;
}

async function getVectorStore() {
	if (!vectorStore) {
		vectorStore = await initVectorStore();
	}
	return vectorStore;
}

export { getVectorStore };
