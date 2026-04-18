import { Router } from 'express';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import env from '../config/env.js';
import { UserUpload } from '../db/db.js';
import { isLoggedIn } from '../middleware/auth.js';
import { s3Client } from './aws.js';

const router = Router();

const CONTRIBUTION_BUCKET = env.BUCKET;

function sanitizeFileName(fileName) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function buildContributionKey(profileId, fileName) {
    const safeFileName = sanitizeFileName(fileName);
    return `resources/contributions/${Date.now()}-${safeFileName}`;
}

router.post('/presign', isLoggedIn, async (req, res) => {
    const profileId = req.user.profileId;
    const fileName = typeof req.body?.fileName === "string" ? req.body.fileName.trim() : "";
    const fileType = typeof req.body?.fileType === "string" && req.body.fileType.trim()
        ? req.body.fileType.trim()
        : "application/octet-stream";

    if (!fileName) {
        return res.status(400).json({ message: "File name is required." });
    }

    try {
        const key = buildContributionKey(profileId, fileName);

        const uploadCommand = new PutObjectCommand({
            Bucket: CONTRIBUTION_BUCKET,
            Key: key,
            ContentType: fileType,
        });

        const url = await getSignedUrl(s3Client, uploadCommand, { expiresIn: 300 });

        return res.status(201).json({
            url,
            key,
        });
    } catch (error) {
        console.error("Contribution presign failed:", error);
        return res.status(500).json({ message: "Failed to prepare upload." });
    }
});

router.post('/', isLoggedIn, async (req, res) => {
    const profileId = req.user.profileId;
    const courseCode = typeof req.body?.courseCode === "string" && req.body.courseCode.trim()
        ? req.body.courseCode.trim()
        : null;
    const courseName = typeof req.body?.courseName === "string" && req.body.courseName.trim()
        ? req.body.courseName.trim()
        : null;
    const resourceName = typeof req.body?.resourceName === "string" && req.body.resourceName.trim()
        ? req.body.resourceName.trim()
        : null;
    const resourceType = typeof req.body?.resourceType === "string" && req.body.resourceType.trim()
        ? req.body.resourceType.trim()
        : "resources";
    const branch = typeof req.body?.branch === "string" && req.body.branch.trim()
        ? req.body.branch.trim()
        : null;
    const semester = typeof req.body?.semester === "string" && req.body.semester.trim()
        ? req.body.semester.trim()
        : null;
    const originalFileName = typeof req.body?.originalFileName === "string" ? req.body.originalFileName.trim() : "";
    const mimeType = typeof req.body?.mimeType === "string" && req.body.mimeType.trim()
        ? req.body.mimeType.trim()
        : "application/octet-stream";
    const key = typeof req.body?.key === "string" ? req.body.key.trim() : "";
    const fileSize = Number(req.body?.fileSize);

    if (!originalFileName || !key) {
        return res.status(400).json({ message: "File details are required." });
    }

    if (!["resources", "pyqs", "other"].includes(resourceType)) {
        return res.status(400).json({ message: "Invalid resource type." });
    }

    if (!Number.isFinite(fileSize) || fileSize < 0) {
        return res.status(400).json({ message: "Invalid file size." });
    }

    if (!key.startsWith(`resources/contributions/`)) {
        return res.status(400).json({ message: "Invalid contribution key." });
    }

    try {
        const userUpload = await UserUpload.create({
            profileId,
            courseCode,
            courseName,
            resourceName,
            resourceType,
            branch,
            semester,
            originalFileName,
            mimeType,
            fileSize,
            AWSKey: key,
        });

        return res.status(201).json({
            message: 'uploaded successfully!',
            contributionId: userUpload._id,
            key,
        });
    } catch (error) {
        console.error("Contribution create failed:", error);
        return res.status(500).json({ message: "Failed to save contribution." });
    }
});

export default router;
