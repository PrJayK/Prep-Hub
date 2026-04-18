import env from '../config/env.js';
import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";

const BUCKET = env.BUCKET;

const sqsClient = new SQSClient({
    region: "ap-south-1",
    credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
});

const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY
    }
})

export { s3Client, sqsClient, BUCKET };