import { InferenceClient } from "@huggingface/inference";
import env from "./env.js";

const client = new InferenceClient(env.HUGGINGFACEHUB_ACCESS_KEY);

export async function rerank(query, docs) {
	const pairs = docs.map(doc => ({
		text: query,
		text_pair: doc.pageContent
	}));

	const response = await client.textClassification({
		model: "BAAI/bge-reranker-v2-m3",
		inputs: pairs
	});
	const ranked = docs
		.map((doc, i) => ({
			doc,
			score: response[i].score
		}))
		.sort((a, b) => b.score - a.score);

	return ranked.map(r => r.doc);
}