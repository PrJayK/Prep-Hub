import { sqsClient } from "../../config/aws.config.js";
import env from "../../config/env.js";
import { SendMessageCommand } from "@aws-sdk/client-sqs";

export async function sendToIngestionQueue(resourceId) {
	const command = new SendMessageCommand({
		QueueUrl: env.SQS_QUEUE_URL,
		MessageBody: JSON.stringify({
			resourceId,
		}),
	});

	const response = await sqsClient.send(command);
	return response;
}