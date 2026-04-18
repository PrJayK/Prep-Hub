import { ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import env from "../config/env.js";
import { ingestResource } from "../services/rag/ingestion.service.js";
import { sqsClient } from "../config/aws.config.js";
import { Course, Resource } from "../db/db.js";

const MAX_RECEIVE_COUNT = 3;

function getQueueUrl() {
	return env.SQS_QUEUE_URL;
}

function getReceiveCount(message) {
	const receiveCount = Number(message?.Attributes?.ApproximateReceiveCount);
	return Number.isFinite(receiveCount) && receiveCount > 0 ? receiveCount : 1;
}

function shouldDiscardMessage(error, receiveCount) {
	if (error?.name === "SyntaxError") {
		return true;
	}

	if (error?.code === "INVALID_MESSAGE" || error?.code === "RESOURCE_NOT_FOUND") {
		return true;
	}

	return receiveCount >= MAX_RECEIVE_COUNT;
}

async function getResourceForMessage(message) {
	let data;

	try {
		data = JSON.parse(message.Body);
	} catch (error) {
		error.code = "INVALID_MESSAGE";
		throw error;
	}

	const resourceId =
		typeof data?.resourceId === "string" ? data.resourceId.trim() : "";

	if (!resourceId) {
		const error = new Error("Message does not include a valid resourceId.");
		error.code = "INVALID_MESSAGE";
		throw error;
	}

	const resource = await Resource.findById(resourceId).lean();

	if (!resource) {
		const error = new Error(`Resource ${resourceId} not found.`);
		error.code = "RESOURCE_NOT_FOUND";
		throw error;
	}

	const linkedCourses = await Course.find(
		{
			$or: [
				{ resources: resource._id },
				{ PYQs: resource._id },
			],
		},
		{ _id: 1 }
	).lean();

	return {
		...resource,
		courseIds: linkedCourses.map((course) => course._id.toString()),
	};
}

export async function receiveMessages() {
	const command = new ReceiveMessageCommand({
		QueueUrl: getQueueUrl(),
		MaxNumberOfMessages: 1,
		WaitTimeSeconds: 10,
		AttributeNames: ["ApproximateReceiveCount"],
	});

	const response = await sqsClient.send(command);
	return response.Messages || [];
}

export async function deleteMessage(receiptHandle) {
	const command = new DeleteMessageCommand({
		QueueUrl: getQueueUrl(),
		ReceiptHandle: receiptHandle,
	});

	await sqsClient.send(command);
}

async function ingestionWorker() {
	while (true) {
		try {
			const messages = await receiveMessages();

			for (const message of messages) {
				const receiveCount = getReceiveCount(message);

				try {
					const resource = await getResourceForMessage(message);
					const result = await ingestResource(resource);

					if (!result.success) {
						throw new Error(result.error || `Ingestion failed for resource ${resource._id}.`);
					}

					await deleteMessage(message.ReceiptHandle);
				} catch (error) {
					const discardMessage = shouldDiscardMessage(error, receiveCount);

					console.error(
						`Failed to process SQS message (attempt ${receiveCount}${discardMessage ? ", discarding" : ""}):`,
						error.message
					);

					if (discardMessage) {
						await deleteMessage(message.ReceiptHandle);
					}
				}
			}
		} catch (error) {
			console.error("SQS polling failed:", error.message);
		}
	}
}

export { ingestionWorker };
