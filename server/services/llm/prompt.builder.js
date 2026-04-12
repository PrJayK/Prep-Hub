function buildPrompt(query, context) {
	return`
You are an AI assistant. Answer the question using ONLY the context below.If the answer is not in the context, politely say that you were unable to find any information regarding the question. Don't say exactly these words, but say something which would politely decline the request.

Context:
${context}

Question:
${query}

Answer:
`;
}

export { buildPrompt };