import { llm } from "../config/llm.config.js";
import { rephrasePrompt } from "../services/rag/prompt.builder.js";

async function declineOutOfScopeRequest() {
    const message = "I cannot answer that question. It seems to be outside the scope of the courses you are enrolled in. Could you ask something else?";
    return await llm.invoke(rephrasePrompt(message));
}

export { declineOutOfScopeRequest };