import { getVectorStore } from "./vector.store.js";

async function retrieveTopK(query, k, filter) {
  const vectorStore = await getVectorStore();

  const results = await vectorStore.similaritySearchVectorWithScore(query, k, filter);

  return results;
}

export { retrieveTopK };
