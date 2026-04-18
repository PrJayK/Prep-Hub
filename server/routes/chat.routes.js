import { Router } from "express";
import { handleChatQuery } from "../services/chat/chat.service.js";
import { authorizeRoles, isLoggedIn } from "../middleware/auth.js";
import { ingestResource } from "../services/rag/ingestion.service.js";
import { getAllResourcesForIngestion } from "../services/courses/courses.service.js";
import {
    getConversationMessagesForUser,
    getConversationsForUser,
    softDeleteConversationForUser
} from "../services/conversation/conversation.service.js";

const router = Router();

function sendRouteError(res, error, fallbackMessage = "Internal Server Error") {
    const statusCode = error.statusCode || 500;

    if (statusCode >= 500) {
        return res.status(statusCode).json({ error: fallbackMessage });
    }

    return res.status(statusCode).json({ message: error.message });
}

router.post('/', isLoggedIn, async (req, res) => {
    const { query } = req.body;
    // console.log(query);
    const profileId = req.user.profileId;

    try {
        const response = await handleChatQuery(query, profileId);
        res.json({
            content: response.content,
            sources: Array.isArray(response.sources) ? response.sources : [],
            conversationId: response.conversationId ?? query?.conversationId ?? null,
            conversationTitle: response.conversationTitle ?? null
        });
    } catch (error) {
        console.error("Error in responding query:", error);
        sendRouteError(res, error);
    }
});

router.get('/conversations', isLoggedIn, async (req, res) => {
    const profileId = req.user.profileId;

    try {
        const conversations = await getConversationsForUser(profileId);
        res.json({ conversations });
    } catch (error) {
        console.error("Error loading conversations:", error);
        sendRouteError(res, error);
    }
});

router.get('/conversations/:conversationId/messages', isLoggedIn, async (req, res) => {
    const profileId = req.user.profileId;
    const { conversationId } = req.params;

    try {
        const messages = await getConversationMessagesForUser(profileId, conversationId);
        res.json({ messages });
    } catch (error) {
        console.error("Error loading conversation messages:", error);
        sendRouteError(res, error);
    }
});

router.delete('/conversations/:conversationId', isLoggedIn, async (req, res) => {
    const profileId = req.user.profileId;
    const { conversationId } = req.params;

    try {
        await softDeleteConversationForUser(profileId, conversationId);
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting conversation:", error);
        sendRouteError(res, error);
    }
});

router.post('/ingestAllResources', isLoggedIn, authorizeRoles("admin"), async (req, res) => {
    try {
        const resources = await getAllResourcesForIngestion();

        if (resources.length === 0) {
            return res.json({ ingestedResources: 0, failedResources: 0, ingestedChunks: 0, failures: [] });
        }

        const batchSize = 5;
        const ingestionResults = [];

        for (let i = 0; i < resources.length; i += batchSize) {
            const batch = resources.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map((resource) => ingestResource(resource)));
            ingestionResults.push(...batchResults);
        }

        const ingestedResources = ingestionResults.filter((result) => result.success).length;
        const failedResources = ingestionResults.filter((result) => !result.success).length;
        const ingestedChunks = ingestionResults.reduce((sum, result) => sum + (result.chunksAdded || 0), 0);
        const failures = ingestionResults
            .filter((result) => !result.success)
            .map((result) => ({ resourceId: result.resourceId, error: result.error }));

        res.json({
            ingestedResources,
            failedResources,
            ingestedChunks,
            failures
        });
    } catch (error) {
        console.error("Error ingesting resources:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export const chatRouter = router;
