import { embedder } from "../../config/embedder.config.js";
import { getPromptForGeneralContext, getPromptForSpecificContext, contextRequirementClassifierPrompt, queryVariationPrompt } from "./prompt.builder.js";
import { getVectorStore } from "./vector.store.js";
import { llm } from "../../config/llm.config.js";
import { getRunningContextForConversation, updateRunningContextForConversation, getRunningContextStrengthForConversation } from "../conversation/conversation.service.js";
import { rerank } from "../../config/reranker.config.js";

const QUERY_VARIATION_COUNT = 2;
const TOP_K_PER_QUERY = 8;
const RERANKED_TOP_K = 10;
const DEFAULT_RETRIEVAL_PIPELINE = retrieveChunksWithVariationsAndReranking;

function getLLMText(response) {
	return normalizeLLMContent(response?.content ?? response ?? "");
}

async function executeRAGWithContext(query, userInfo, options = {}) {
	if (!query) {
		throw new Error("Query is required.");
	}
	const queryText = query.text;
	const resourceId = query.resourceId;
	const conversationId = query.conversationId;
	
	if (!queryText || !resourceId || !conversationId) {
		throw new Error("Query text, resourceId, and conversationId are required.");
	}

	const {
		k = TOP_K_PER_QUERY,
		retrievalPipeline = DEFAULT_RETRIEVAL_PIPELINE
	} = options;

	const classifierPrompt = await contextRequirementClassifierPrompt(queryText, conversationId);
	const classifierResponse = await llm.invoke(classifierPrompt);
	const classifierText = (classifierResponse?.content ?? classifierResponse).toString().trim().toUpperCase();
	const needsContextChange = classifierText.includes("YES");
	//console.log("RAG with context | needsContextChange:", needsContextChange);

	const vectorStore = await getVectorStore();
	const documentChunks = await retrievalPipeline({
		originalQuery: queryText,
		k,
		filter: { resourceId },
		vectorStore,
		retrievalLabel: "selected-document"
	});
	const documentContext = formatRetrievedChunks(documentChunks);

	let resourceChunks = [];
	let resourceContext = "";

	if (needsContextChange) {
		resourceChunks = await retrievalPipeline({
			originalQuery: queryText,
			k,
			filter: {
				resourceId: { $nin: [resourceId.toString()] }
			},
			vectorStore,
			retrievalLabel: "course-context",
			initialK: Math.max(k * 5, 12),
			postFilter: createCourseMatchFilter(userInfo.enrolledCourses)
		});

		resourceContext = formatRetrievedChunks(resourceChunks);

		if (resourceContext) {
			const resourceContextStrength = getContextStrength(resourceChunks);
			await updateRunningContextForConversation(conversationId, resourceContext, resourceContextStrength);
		}
	} else {
		resourceContext = await getRunningContextForConversation(conversationId);
	}

	const contextStrength = getContextStrength(documentChunks);
	const citationRegistry = createCitationRegistry([...documentChunks, ...resourceChunks]);
	//console.log("RAG with context | selected document chunks:", documentChunks);
	//console.log("RAG with context | secondary resource chunks:", resourceChunks);
	//console.log("RAG with context | contextStrength:", contextStrength);

	const prompt = await getPromptForSpecificContext(queryText, documentContext, resourceContext, userInfo, conversationId, contextStrength);
	// console.log(prompt);
	const response = await llm.invoke(prompt);
	
	return parseAndValidateRAGResponse(response, citationRegistry);
}

async function executeRAGWithoutContext(query, userInfo, options = {}) {
	const queryText = query.text;
	const conversationId = query.conversationId;

	if (!queryText || !conversationId) {
		throw new Error("Query text and conversationId are required.");
	}

	const {
		k = TOP_K_PER_QUERY,
		retrievalPipeline = DEFAULT_RETRIEVAL_PIPELINE
	} = options;

	const classifierPrompt = await contextRequirementClassifierPrompt(queryText, conversationId);
	const classifierResponse = await llm.invoke(classifierPrompt);
	const classifierText = (classifierResponse?.content ?? classifierResponse).toString().trim().toUpperCase();
	const needsContextChange = classifierText.includes("YES");
	//console.log("RAG without context | needsContextChange:", needsContextChange);
	let resourceChunks = [];
	let resourceContext = "";
	
	if (needsContextChange) {
		resourceChunks = await retrievalPipeline({
			originalQuery: queryText,
			k,
			retrievalLabel: "general-course-context",
			initialK: k * 2,
			postFilter: createCourseMatchFilter(userInfo.enrolledCourses)
		});
		resourceContext = formatRetrievedChunks(resourceChunks);

		if (resourceContext) {
			const contextStrength = getContextStrength(resourceChunks);
			await updateRunningContextForConversation(conversationId, resourceContext, contextStrength);
		}
	} else {
		resourceContext = await getRunningContextForConversation(conversationId);
	}

	const contextStrength = needsContextChange ? getContextStrength(resourceChunks) : await getRunningContextStrengthForConversation(conversationId);
	const citationRegistry = createCitationRegistry(resourceChunks);
	// console.log("RAG without context | resource chunks:", resourceChunks);
	//console.log("RAG without context | contextStrength:", contextStrength);

	const prompt = await getPromptForGeneralContext(queryText, resourceContext, contextStrength, userInfo, query.conversationId);
	// console.log(prompt);
	const response = await llm.invoke(prompt);
	// console.log("typeof response.content:", typeof response.content);
	// console.log("raw content value:", response.content);
	// console.log("json-stringified content:", JSON.stringify(response.content));

	return parseAndValidateRAGResponse(response, citationRegistry);	
}

async function generateQueryVariations(queryText) {
	const prompt = queryVariationPrompt(queryText, QUERY_VARIATION_COUNT);

	try {
		const response = await llm.invoke(prompt);
		const text = (response?.content ?? response).toString();
		const variations = text
			.split("\n")
			.map((line) => line.replace(/^\s*(\d+[\).\-\s]*)?/, "").trim())
			.filter(Boolean)
			.filter((line) => line.toLowerCase() !== queryText.toLowerCase());

		const uniqueVariations = Array.from(new Set(variations)).slice(0, QUERY_VARIATION_COUNT);

		if (uniqueVariations.length === QUERY_VARIATION_COUNT) {
			const generatedQueries = [queryText, ...uniqueVariations];
			//console.log("Generated query variations:", generatedQueries);
			return generatedQueries;
		}
	} catch (error) {
		console.error("Failed to generate query variations:", error);
	}

	const fallbackQueries = [
		queryText,
		`${queryText} explained simply`,
		`Key concepts of ${queryText}`,
		`Detailed explanation of ${queryText}`,
	];
	//console.log("Generated query variations (fallback):", fallbackQueries);
	return fallbackQueries;
}

async function retrieveChunksWithVariationsAndReranking({
	originalQuery,
	k,
	filter = null,
	vectorStore = null,
	retrievalLabel = "default",
	initialK = k,
	postFilter = null,
	rerankedTopK = RERANKED_TOP_K
}) {
	const activeVectorStore = vectorStore ?? await getVectorStore();
	const expandedQueries = await generateQueryVariations(originalQuery);
	const uniqueQueries = Array.from(new Set(expandedQueries.filter(Boolean)));

	const allResults = await Promise.all(
		uniqueQueries.map(async (variantQuery) => {
			const queryEmbeddings = await embedder.embedQuery(variantQuery);
			const results = await activeVectorStore.similaritySearchVectorWithScore(
				queryEmbeddings,
				initialK,
				filter ?? undefined
			);
			// console.log(`${retrievalLabel} | raw vector results for query:`, variantQuery, results);
			return results;
		})
	);

	const mergedResults = mergeRetrievedResults(allResults.flat()).filter(([doc, score]) => (
		typeof postFilter === "function" ? postFilter(doc, score) : true
	));

	if (mergedResults.length === 0) {
		return [];
	}

	const rerankedDocs = await rerank(
		originalQuery,
		mergedResults.map(([doc]) => doc)
	);

	const rerankedDocKeys = new Set(rerankedDocs.slice(0, rerankedTopK).map(getChunkKey));

	const topChunks = mergedResults
		.filter(([doc]) => rerankedDocKeys.has(getChunkKey(doc)))
		.sort((a, b) => {
			const aIndex = rerankedDocs.findIndex((doc) => getChunkKey(doc) === getChunkKey(a[0]));
			const bIndex = rerankedDocs.findIndex((doc) => getChunkKey(doc) === getChunkKey(b[0]));
			return aIndex - bIndex;
		})
		.slice(0, rerankedTopK);

	return topChunks;
}

async function retrieveChunksWithoutVariationsOrReranking({
	originalQuery,
	k,
	filter = null,
	vectorStore = null,
	retrievalLabel = "default",
	initialK = k,
	postFilter = null
}) {
	const activeVectorStore = vectorStore ?? await getVectorStore();
	const queryEmbeddings = await embedder.embedQuery(originalQuery);
	const rawResults = await activeVectorStore.similaritySearchVectorWithScore(
		queryEmbeddings,
		initialK,
		filter ?? undefined
	);

	const topChunks = mergeRetrievedResults(rawResults)
		.filter(([doc, score]) => (
			typeof postFilter === "function" ? postFilter(doc, score) : true
		))
		.slice(0, k);

	return topChunks;
}

function mergeRetrievedResults(results) {
	const merged = new Map();

	for (const item of results) {
		const [doc, score] = Array.isArray(item) ? item : [];
		const key = getChunkKey(doc);

		if (!doc || !key) {
			continue;
		}

		const existing = merged.get(key);
		if (!existing || score > existing[1]) {
			merged.set(key, [doc, score]);
		}
	}

	return Array.from(merged.values()).sort((a, b) => b[1] - a[1]);
}

function createCourseMatchFilter(enrolledCourses = []) {
	const enrolledCourseIds = new Set(
		enrolledCourses
			.map((course) => course?._id?.toString())
			.filter(Boolean)
	);

	return (doc) => {
		if (enrolledCourseIds.size === 0) {
			return false;
		}

		const courseIds = Array.isArray(doc?.metadata?.courseIds)
			? doc.metadata.courseIds.map((courseId) => courseId?.toString()).filter(Boolean)
			: [];

		return courseIds.some((courseId) => enrolledCourseIds.has(courseId));
	};
}

function getChunkKey(doc) {
	if (!doc) {
		return "";
	}

	const metadata = doc.metadata ?? {};
	return [
		metadata.resourceId ?? "",
		metadata.pageNumber ?? "",
		metadata.chunkIndex ?? "",
		metadata.startChar ?? "",
		doc.pageContent ?? "",
	].join("::");
}

function formatRetrievedChunks(chunks) {
	if (!Array.isArray(chunks) || chunks.length === 0) {
		return "";
	}

	return chunks
		.map((item, index) => {
			const [doc, score] = Array.isArray(item) ? item : [item, undefined];

			if (!doc) {
				return "";
			}

			const metadata = doc.metadata ?? {};
			const lines = [];
			const sourceId = `S${index + 1}`;

			lines.push(`SourceChunk:`);
			lines.push(`- sourceId: ${sourceId}`);
			lines.push(`- resourceId: ${metadata.resourceId ?? "null"}`);
			lines.push(`- resourceName: ${metadata.name ?? "Untitled"}`);
			lines.push(`- page: ${normalizePage(metadata.pageNumber) ?? "null"}`);
			lines.push(`- chunkIndex: ${metadata.chunkIndex ?? "null"}`);

			if (typeof score === "number") {
				lines.push(`- score: ${score}`);
			}

			if (doc.pageContent) {
				lines.push(`- text: """${doc.pageContent}"""`);
			}

			return lines.join("\n");
		})
		.filter(Boolean)
		.join("\n\n");
}

function createCitationRegistry(chunks) {
	if (!Array.isArray(chunks) || chunks.length === 0) {
		return new Map();
	}

	const registry = new Map();

	chunks.forEach((item, index) => {
		const [doc] = Array.isArray(item) ? item : [item];

		if (!doc) {
			return;
		}

		const metadata = doc.metadata ?? {};
		const sourceId = `S${index + 1}`;
		const resourceId = metadata.resourceId?.toString?.() ?? null;
		const page = normalizePage(metadata.pageNumber);

		if (!resourceId) {
			return;
		}

		registry.set(sourceId, {
			id: sourceId,
			sourceId,
			resourceId,
			page,
			label: metadata.name || "Untitled",
			preview: buildSourcePreview(doc.pageContent),
			chunkIndex: normalizeNullableNumber(metadata.chunkIndex),
			quote: null,
			claim: null
		});
	});

	return registry;
}

function parseAndValidateRAGResponse(response, citationRegistry) {
	const rawContent = response?.content ?? response ?? "";
	const rawText = getLLMText(response);
	const parsed = parseStructuredResponse(rawContent);
	const answer = typeof parsed?.answer === "string" && parsed.answer.trim()
		? parsed.answer.trim()
		: rawText;
	const sources = validateCitations(parsed?.citations, citationRegistry);

	return {
		content: answer,
		sources
	};
}

function parseStructuredResponse(rawContent) {
	if (rawContent === null || rawContent === undefined || rawContent === "") {
		return { answer: "", citations: [] };
	}

	if (typeof rawContent === "object" && !Array.isArray(rawContent)) {
		return rawContent;
	}

	if (Array.isArray(rawContent)) {
		const joinedText = normalizeLLMContent(rawContent);
		return parseStructuredResponse(joinedText);
	}

	const rawText = normalizeLLMContent(rawContent);
	const normalized = rawText.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();

	const directParsed = tryParseStructuredJson(normalized);
	if (directParsed) {
		return directParsed;
	}

	const extracted = extractFirstJsonObject(normalized);
	if (extracted) {
		const extractedParsed = tryParseStructuredJson(extracted);
		if (extractedParsed) {
			return extractedParsed;
		}
	}

	return { answer: rawText, citations: [] };
}

function tryParseStructuredJson(text) {
	if (!text) {
		return null;
	}

	const candidates = [text, escapeLiteralNewlinesInJsonStrings(text)];

	for (const candidate of candidates) {
		try {
			const parsed = JSON.parse(candidate);
			if (typeof parsed === "string") {
				return parseStructuredResponse(parsed);
			}

			if (parsed && typeof parsed === "object") {
				return parsed;
			}
		} catch {
			continue;
		}
	}

	return null;
}

function escapeLiteralNewlinesInJsonStrings(text) {
	let result = "";
	let inString = false;
	let escaped = false;

	for (const char of text) {
		if (escaped) {
			result += char;
			escaped = false;
			continue;
		}

		if (char === "\\") {
			result += char;
			escaped = true;
			continue;
		}

		if (char === "\"") {
			result += char;
			inString = !inString;
			continue;
		}

		if (inString && char === "\n") {
			result += "\\n";
			continue;
		}

		if (inString && char === "\r") {
			result += "\\r";
			continue;
		}

		result += char;
	}

	return result;
}

function normalizeLLMContent(content) {
	if (content === null || content === undefined) {
		return "";
	}

	if (typeof content === "string") {
		return content.trim();
	}

	if (Array.isArray(content)) {
		return content
			.map((item) => {
				if (typeof item === "string") {
					return item;
				}

				if (item && typeof item === "object") {
					if (typeof item.text === "string") {
						return item.text;
					}

					if (typeof item.content === "string") {
						return item.content;
					}
				}

				return "";
			})
			.join("")
			.trim();
	}

	if (typeof content === "object") {
		try {
			return JSON.stringify(content);
		} catch {
			return String(content).trim();
		}
	}

	return String(content).trim();
}

function extractFirstJsonObject(text) {
	const firstBrace = text.indexOf("{");
	if (firstBrace === -1) {
		return null;
	}

	let depth = 0;
	let inString = false;
	let escaped = false;

	for (let index = firstBrace; index < text.length; index += 1) {
		const char = text[index];

		if (escaped) {
			escaped = false;
			continue;
		}

		if (char === "\\") {
			escaped = true;
			continue;
		}

		if (char === "\"") {
			inString = !inString;
			continue;
		}

		if (inString) {
			continue;
		}

		if (char === "{") {
			depth += 1;
		} else if (char === "}") {
			depth -= 1;
			if (depth === 0) {
				return text.slice(firstBrace, index + 1);
			}
		}
	}

	return null;
}

function validateCitations(citations, citationRegistry) {
	if (!Array.isArray(citations) || !(citationRegistry instanceof Map) || citationRegistry.size === 0) {
		return [];
	}

	const validatedSources = [];
	const seenSourceKeys = new Set();

	for (const citation of citations) {
		if (!citation || typeof citation !== "object") {
			continue;
		}

		const sourceId = typeof citation.sourceId === "string" ? citation.sourceId.trim() : "";
		const registryEntry = sourceId ? citationRegistry.get(sourceId) : null;

		if (!registryEntry) {
			continue;
		}

		const resourceId = typeof citation.resourceId === "string" ? citation.resourceId.trim() : null;
		const page = normalizePage(citation.page);

		if (resourceId && resourceId !== registryEntry.resourceId) {
			continue;
		}

		if (page !== null && registryEntry.page !== null && page !== registryEntry.page) {
			continue;
		}

		if (seenSourceKeys.has(registryEntry.id)) {
			continue;
		}

		seenSourceKeys.add(registryEntry.id);
		validatedSources.push({
			...registryEntry,
			quote: typeof citation.quote === "string" ? citation.quote.trim().slice(0, 280) || null : null,
			claim: typeof citation.claim === "string" ? citation.claim.trim().slice(0, 280) || null : null
		});
	}

	return validatedSources;
}

function normalizePage(value) {
	const parsed = normalizeNullableNumber(value);
	return parsed === null ? null : parsed;
}

function normalizeNullableNumber(value) {
	if (value === null || value === undefined || value === "") {
		return null;
	}

	const parsed = Number.parseInt(value, 10);
	return Number.isNaN(parsed) ? null : parsed;
}

function buildSourcePreview(text = "") {
	const compact = String(text).replace(/\s+/g, " ").trim();
	if (!compact) {
		return "";
	}

	return compact.length > 220 ? `${compact.slice(0, 217)}...` : compact;
}

function getContextStrength(docs) {
	if (!docs || docs.length === 0) return "NONE";

	const scores = docs.map(c => c[1]);

	const topScore = scores[0];
	const avgTop3 = scores.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, scores.length);

	if (topScore >= 0.8 && avgTop3 >= 0.7) {
		return "STRONG";
	}

	if (topScore >= 0.65) {
		return "WEAK";
	}

	return "NONE";
}

export {
	executeRAGWithoutContext,
	executeRAGWithContext,
	retrieveChunksWithVariationsAndReranking,
	retrieveChunksWithoutVariationsOrReranking
};
