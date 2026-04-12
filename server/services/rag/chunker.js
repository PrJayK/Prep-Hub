import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const splitter = new RecursiveCharacterTextSplitter({
	chunkSize: 500,
	chunkOverlap: 100,
});

async function chunkDocuments(documents) {
	const texts = documents.map(d => d.content);

	const metadatas = documents.map(d => ({
		id: d._id || "unknown",
		title: d.title || "Untitled",
	}));

	const chunks = await splitter.createDocuments(texts, metadatas);

	return chunks;
}

export { chunkDocuments };
