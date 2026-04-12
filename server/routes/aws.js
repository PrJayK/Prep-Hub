import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Router } from "express";
import { isLoggedIn } from "../middleware/auth.js";
import "../config/env.js";

const router = Router();

const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWSAccessKeyId,
        secretAccessKey: process.env.AWSSecretAccessKey
    }
})

router.post('/getObjectUrl', isLoggedIn, async (req, res) => {
    const { key } = req.body;

    if(!key) {
        return res.status(400).json({
            message: "key not found"
        });
    }

    const command = new GetObjectCommand({
        Bucket: "prephub-dev",
        Key: key
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 20 });
    
    res.json({
        url: url
    });
});

router.post('/putObjectUrl', isLoggedIn, async (req, res) => {
    const { fileName, fileType } = req.body;

    if(!fileName || !fileType) {
        return res.status(400).json({
            message: "invalid inputs"
        });
    }

    const uploadDir = 'userUploads/';

    const key = uploadDir + Date.now() + fileName;
    
    const command = new PutObjectCommand({
        Bucket: 'prephub-dev',
        Key: key,
        ContentType: fileType
    });

    const url = await getSignedUrl(s3Client, command);

    res.json({
        url: url,
        key: key
    });
});

router.post('deleteObjectUrl', isLoggedIn, async (req, res) => {
    const { key } = req.body;
    
    if(!key) {
        return res.status(400).json({
            message: "key not found"
        });
    }

    const command = new DeleteObjectCommand({
        Bucket: 'prephub-dev',
        key: key,
    });

    s3Client.send(command)
        .then(data => {
            res.sendStatus(200);
        })
        .catch(err => {
            res.json({message: 'Error deleting object'}).status(400);
        });
});

export { router as awsRouter };
