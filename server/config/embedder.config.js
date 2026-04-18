import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import env from "./env.js";

export const embedder = new HuggingFaceInferenceEmbeddings({
  apiKey: env.HUGGINGFACEHUB_ACCESS_KEY,
  model: "sentence-transformers/all-MiniLM-L6-v2",
});