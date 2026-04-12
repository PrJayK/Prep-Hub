import { getVectorStore } from "./vector.store.js";

async function retrieveTopK(query, k = 3) {
  const vectorStore = await getVectorStore();

  const results = await vectorStore.similaritySearchVectorWithScore(query, k);

  return results;
}

export { retrieveTopK };
