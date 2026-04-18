import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.js";
import { BUCKET, s3Client } from "../config/aws.config.js";
import "../config/env.js";

const router = Router();

router.post('/getObjectUrl', isLoggedIn, async (req, res) => {
    const { key } = req.body;

    if(!key) {
        return res.status(400).json({
            message: "key not found"
        });
    }

    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    
    res.json({
        url: url
    });
});

async function getObjectBuffer(key) {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key
    });

    const response = await s3Client.send(command);
    const body = response.Body;

    if (!body) {
        throw new Error(`S3 object ${key} returned empty body`);
    }

    if (Buffer.isBuffer(body)) {
        return body;
    }

    if (body instanceof Uint8Array) {
        return Buffer.from(body);
    }

    const chunks = [];
    for await (const chunk of body) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }

    return Buffer.concat(chunks);
}

export { router as awsRouter, s3Client, getObjectBuffer };
