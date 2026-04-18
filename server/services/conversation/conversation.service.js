import mongoose from "mongoose";
import { Message, Conversation, UserGoogle } from "../../db/db.js";

function createHttpError(message, statusCode = 500) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function getUserForProfileId(profileId) {
    const user = await UserGoogle.findOne({ profileId }).select("_id").lean();

    if (!user) {
        throw createHttpError("User not found.", 404);
    }

    return user;
}

function assertValidObjectId(id, label = "id") {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw createHttpError(`Invalid ${label}.`, 400);
    }
}

async function getLastMessagesFromConversation(conversationId, limit = 10) {
    const parsedLimit = Math.max(1, Number.parseInt(limit, 10) || 10);

    const messages = await Message.find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .lean();

    return messages.reverse();
}

async function getRunningContextForConversation(conversationId) {
    const conversation = await Conversation.findById(conversationId);
    return conversation?.runningContext || "";
}

async function getRunningContextStrengthForConversation(conversationId) {
    const conversation = await Conversation.findById(conversationId);
    return conversation?.runningContextStrength || "NONE";
}

async function getLastMessageFromConversation(conversationId) {
    const [message] = await getLastMessagesFromConversation(conversationId, 1);
    return message ?? null;
}

async function createConversation(profileId) {
    const user = await getUserForProfileId(profileId);
    const conversation = new Conversation({ profileId: user._id });
    await conversation.save();
    return conversation;
}

async function getOwnedConversation(profileId, conversationId) {
    assertValidObjectId(conversationId, "conversation id");

    const user = await getUserForProfileId(profileId);
    const conversation = await Conversation.findOne({
        _id: conversationId,
        profileId: user._id,
        isDeleted: { $ne: true }
    });

    if (!conversation) {
        throw createHttpError("Conversation not found.", 404);
    }

    return conversation;
}

async function getConversationsForUser(profileId) {
    const user = await getUserForProfileId(profileId);
    const conversations = await Conversation.find({
        profileId: user._id,
        isDeleted: { $ne: true }
    })
        .sort({ updatedAt: -1 })
        .select("_id title lastMessage createdAt updatedAt")
        .lean();

    return conversations.map((conversation) => ({
        conversationId: conversation._id,
        title: conversation.title,
        lastMessage: conversation.lastMessage || "",
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
    }));
}

async function getConversationMessagesForUser(profileId, conversationId) {
    await getOwnedConversation(profileId, conversationId);

    const messages = await Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .select("_id role content sources createdAt")
        .lean();

    return messages.map((message) => ({
        id: message._id,
        role: message.role,
        content: message.content,
        sources: Array.isArray(message.sources) ? message.sources : [],
        createdAt: message.createdAt
    }));
}

async function softDeleteConversationForUser(profileId, conversationId) {
    const conversation = await getOwnedConversation(profileId, conversationId);

    await Conversation.findByIdAndUpdate(
        conversation._id,
        { isDeleted: true },
        { new: true, runValidators: true }
    );
}

async function updateRunningContextForConversation(conversationId, runningContext, runningContextStrength = "NONE") {
    const conversation = await Conversation.findByIdAndUpdate(
        conversationId,
        { runningContext, runningContextStrength },
        { new: true, runValidators: true }
    );
    return conversation;
}

export {
    getLastMessagesFromConversation,
    getRunningContextForConversation,
    getRunningContextStrengthForConversation,
    getLastMessageFromConversation,
    createConversation,
    getOwnedConversation,
    getConversationsForUser,
    getConversationMessagesForUser,
    softDeleteConversationForUser,
    updateRunningContextForConversation
};
