import { ChatGroq } from "@langchain/groq";
import parsed from "./env.js";

const llm = new ChatGroq({
	apiKey: parsed.GROQ_API_KEY,
	model: "llama-3.1-8b-instant",
	temperature: 0.2,
});

export { llm };