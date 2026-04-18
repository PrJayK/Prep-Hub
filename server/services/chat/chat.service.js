import { getNonPopulatedEnrolledCoursesForUser } from "../courses/courses.service.js";
import { llm } from "../../config/llm.config.js";
import { answerableClassifierPrompt, conversationTitlePrompt } from "../rag/prompt.builder.js";
import { executeRAGWithContext, executeRAGWithoutContext } from "../rag/rag.pipeline.js";
import { declineOutOfScopeRequest } from "../../utils/llm.utils.js";
import { createConversation, getOwnedConversation } from "../conversation/conversation.service.js";
import { Message, Conversation } from "../../db/db.js";

function getConversationTitleFromMessage(message) {
    const compactTitle = message.replace(/\s+/g, " ").trim();
    return compactTitle.length > 60 ? `${compactTitle.slice(0, 57)}...` : compactTitle;
}

function cleanConversationTitle(title) {
    const compactTitle = String(title || "")
        .replace(/^["'`]+|["'`]+$/g, "")
        .replace(/[.!?]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();

    if (!compactTitle) {
        return "New Chat";
    }

    return compactTitle.length > 60 ? `${compactTitle.slice(0, 57)}...` : compactTitle;
}

async function generateConversationTitle(userMessage, aiResponse) {
    try {
        const prompt = conversationTitlePrompt(userMessage, aiResponse);
        const response = await llm.invoke(prompt);
        return cleanConversationTitle(response?.content ?? response);
    } catch (error) {
        console.error("Error generating conversation title:", error);
        return getConversationTitleFromMessage(userMessage);
    }
}

function createHttpError(message, statusCode = 500) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function handleChatQuery(query, profileId) {
    const queryText = typeof query === "string"
        ? query
        : query?.text ?? query?.query ?? "";

    if (!queryText) {
        throw createHttpError("Query text is required.", 400);
    }

    const normalizedQuery = {
        ...((typeof query === "object" && query !== null) ? query : {}),
        text: queryText,
    };

    let isNewConversation = false;

    if (normalizedQuery.isNewConversation || !normalizedQuery.conversationId) {
        const conversation = await createConversation(profileId);
        normalizedQuery.conversationId = conversation._id;
        isNewConversation = true;
    } else {
        const conversation = await getOwnedConversation(profileId, normalizedQuery.conversationId);
        normalizedQuery.conversationId = conversation._id;
    }

    if (query && typeof query === "object") {
        query.conversationId = normalizedQuery.conversationId;
    }

    const { name, enrolledCourses } = await getNonPopulatedEnrolledCoursesForUser(profileId);
    // const isAnswerable = await checkAnswerable(normalizedQuery, enrolledCourses.map(c => c.name));
    
    const userInfo = {
        name,
        enrolledCourses
    };

    let response;
    // if (!isAnswerable) {
        // response = await declineOutOfScopeRequest();
    // }
    if (normalizedQuery.resourceId) {
        response = await executeRAGWithContext(normalizedQuery, userInfo);
    } else {
        response = await executeRAGWithoutContext(normalizedQuery, userInfo);
    }

    await Message.create({ conversationId: normalizedQuery.conversationId, role: "user", content: queryText });
    await Message.create({
        conversationId: normalizedQuery.conversationId,
        role: "ai",
        content: response.content,
        sources: Array.isArray(response.sources) ? response.sources : []
    });

    const conversationUpdate = { lastMessage: response.content };
    let generatedTitle = null;

    if (isNewConversation) {
        generatedTitle = await generateConversationTitle(queryText, response.content);
        conversationUpdate.title = generatedTitle;
    }

    await Conversation.findByIdAndUpdate(normalizedQuery.conversationId, conversationUpdate);

    response.conversationId = normalizedQuery.conversationId;
    response.conversationTitle = generatedTitle;
    return response;
}

async function checkAnswerable(query, courses) {
    const prompt = await answerableClassifierPrompt(query, courses);
    const response = await llm.invoke(prompt);
    return String(response?.content ?? response).includes("YES");
}

export { handleChatQuery };
