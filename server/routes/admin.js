import { Router } from 'express';
import mongoose from 'mongoose';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { Course, Resource, UserGoogle, UserUpload } from '../db/db.js';
import { isLoggedIn, authorizeRoles } from '../middleware/auth.js';
import { BUCKET, s3Client } from '../config/aws.config.js';
import { sendToIngestionQueue } from '../services/aws/sqs.service.js';

const router = Router();

const EDITABLE_CONTRIBUTION_FIELDS = [
    "courseCode",
    "courseName",
    "resourceName",
    "resourceType",
    "branch",
    "semester",
    "adminNotes"
];

router.use(isLoggedIn, authorizeRoles("admin"));

function normalizeOptionalString(value) {
    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
}

function sanitizeFileName(fileName) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function buildAdminResourceKey(fileName) {
    const safeFileName = sanitizeFileName(fileName);
    return `resources/admin/${Date.now()}-${safeFileName}`;
}

function isValidContributionType(value) {
    return ["resources", "pyqs", "other"].includes(value);
}

function isValidResourceType(value) {
    return ["resources", "pyqs"].includes(value);
}

function getCourseResourceField(resourceType) {
    return resourceType === "pyqs" ? "PYQs" : "resources";
}

function applyContributionEdits(contribution, payload = {}) {
    for (const field of EDITABLE_CONTRIBUTION_FIELDS) {
        if (!(field in payload)) {
            continue;
        }

        if (field === "resourceType") {
            if (payload[field] && isValidContributionType(payload[field])) {
                contribution[field] = payload[field];
            }
            continue;
        }

        contribution[field] = normalizeOptionalString(payload[field]);
    }

    if ("targetCourseId" in payload) {
        contribution.targetCourseId = normalizeOptionalString(payload.targetCourseId);
    }
}

async function buildContributionList(status = "pending") {
    const query = {};

    if (status && status !== "all") {
        query.status = status;
    }

    const contributions = await UserUpload.find(query)
        .sort({ createdAt: -1 })
        .lean();

    const uploaderIds = Array.from(new Set(
        contributions
            .map((item) => item.profileId)
            .filter(Boolean)
    ));

    const courseIds = Array.from(new Set(
        contributions
            .map((item) => item.targetCourseId?.toString())
            .filter(Boolean)
    ));

    const [uploaders, courses] = await Promise.all([
        UserGoogle.find({ profileId: { $in: uploaderIds } })
            .select("profileId name email")
            .lean(),
        Course.find({ _id: { $in: courseIds } })
            .select("_id id name branch semester")
            .lean()
    ]);

    const uploaderMap = new Map(uploaders.map((item) => [item.profileId, item]));
    const courseMap = new Map(courses.map((item) => [item._id.toString(), item]));

    return contributions.map((item) => ({
        ...item,
        uploader: uploaderMap.get(item.profileId) || null,
        targetCourse: item.targetCourseId ? courseMap.get(item.targetCourseId.toString()) || null : null
    }));
}

async function buildManagedResources(query = {}) {
    const resources = await Resource.find(query)
        .select("_id name dataType AWSKey uploadTime isEmbedded")
        .sort({ uploadTime: -1 })
        .lean();

    if (resources.length === 0) {
        return [];
    }

    const resourceIds = resources.map((resource) => resource._id);
    const courses = await Course.find({
        $or: [
            { resources: { $in: resourceIds } },
            { PYQs: { $in: resourceIds } }
        ]
    })
        .select("_id id name branch semester resources PYQs")
        .lean();

    const courseLinksByResourceId = new Map();

    for (const course of courses) {
        for (const resourceId of course.resources || []) {
            const key = resourceId.toString();
            const links = courseLinksByResourceId.get(key) || [];
            links.push({
                _id: course._id,
                id: course.id,
                name: course.name,
                branch: course.branch,
                semester: course.semester,
                resourceType: "resources"
            });
            courseLinksByResourceId.set(key, links);
        }

        for (const resourceId of course.PYQs || []) {
            const key = resourceId.toString();
            const links = courseLinksByResourceId.get(key) || [];
            links.push({
                _id: course._id,
                id: course.id,
                name: course.name,
                branch: course.branch,
                semester: course.semester,
                resourceType: "pyqs"
            });
            courseLinksByResourceId.set(key, links);
        }
    }

    return resources.map((resource) => ({
        ...resource,
        linkedCourses: courseLinksByResourceId.get(resource._id.toString()) || []
    }));
}

async function buildManagedResource(resourceId) {
    const [resource] = await buildManagedResources({ _id: resourceId });
    return resource || null;
}

async function enqueueResourceForIngestion(resourceId) {
    await sendToIngestionQueue(resourceId.toString());
}

router.post('/courses', async (req, res) => {
    const id = normalizeOptionalString(req.body?.id);
    const name = normalizeOptionalString(req.body?.name);
    const branch = normalizeOptionalString(req.body?.branch);
    const semester = Number(req.body?.semester);
    const bannerKey = normalizeOptionalString(req.body?.bannerKey) || "banners/default";

    if (!id || !name || !branch || !Number.isFinite(semester)) {
        return res.status(400).json({ message: "Course code, name, branch, and semester are required." });
    }

    try {
        const existingCourse = await Course.findOne({ id });

        if (existingCourse) {
            return res.status(409).json({ message: "A course with this code already exists." });
        }

        const course = await Course.create({
            id,
            name,
            branch,
            semester,
            bannerKey,
            PYQs: [],
            resources: []
        });

        return res.status(201).json(course);
    } catch (error) {
        console.error("Failed to create course:", error);
        return res.status(500).json({ message: "Failed to create course." });
    }
});

router.post('/resources/presign', async (req, res) => {
    const fileName = normalizeOptionalString(req.body?.fileName);
    const fileType = normalizeOptionalString(req.body?.fileType) || "application/octet-stream";

    if (!fileName) {
        return res.status(400).json({ message: "File name is required." });
    }

    try {
        const key = buildAdminResourceKey(fileName);
        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            ContentType: fileType,
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });

        return res.status(201).json({ url, key });
    } catch (error) {
        console.error("Admin resource presign failed:", error);
        return res.status(500).json({ message: "Failed to prepare resource upload." });
    }
});

router.post('/resources', async (req, res) => {
    const courseId = normalizeOptionalString(req.body?.courseId);
    const resourceName = normalizeOptionalString(req.body?.resourceName);
    const resourceType = normalizeOptionalString(req.body?.resourceType) || "resources";
    const key = normalizeOptionalString(req.body?.key);
    const mimeType = normalizeOptionalString(req.body?.mimeType) || "application/octet-stream";

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: "A valid course is required." });
    }

    if (!resourceName || !key) {
        return res.status(400).json({ message: "Resource name and uploaded file key are required." });
    }

    if (!["resources", "pyqs"].includes(resourceType)) {
        return res.status(400).json({ message: "Invalid resource type." });
    }

    if (!key.startsWith("resources/admin/")) {
        return res.status(400).json({ message: "Invalid resource key." });
    }

    try {
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }

        const resource = await Resource.create({
            dataType: mimeType,
            name: resourceName,
            AWSKey: key,
            isEmbedded: false
        });

        const targetArray = resourceType === "pyqs" ? "PYQs" : "resources";
        course[targetArray].push(resource._id);
        await course.save();

        try {
            await enqueueResourceForIngestion(resource._id);
        } catch (error) {
            course[targetArray].pull(resource._id);
            await Promise.all([
                course.save(),
                Resource.findByIdAndDelete(resource._id)
            ]);

            console.error("Failed to queue admin resource for ingestion:", error);
            return res.status(502).json({ message: "Resource was saved to storage, but queueing ingestion failed." });
        }

        return res.status(201).json({ resource, course });
    } catch (error) {
        console.error("Failed to create admin resource:", error);
        return res.status(500).json({ message: "Failed to create resource." });
    }
});

router.get('/resources', async (req, res) => {
    try {
        const resources = await buildManagedResources();
        return res.json(resources);
    } catch (error) {
        console.error("Failed to load managed resources:", error);
        return res.status(500).json({ message: "Failed to load resources." });
    }
});

router.get('/resources/unembedded', async (req, res) => {
    try {
        const resources = await Resource.find({
            isEmbedded: { $ne: true },
            AWSKey: { $type: "string", $ne: "" }
        })
            .select("_id name dataType AWSKey uploadTime isEmbedded")
            .sort({ uploadTime: -1 })
            .lean();

        return res.json(resources);
    } catch (error) {
        console.error("Failed to load unembedded resources:", error);
        return res.status(500).json({ message: "Failed to load resources." });
    }
});

router.get('/resources/:resourceId', async (req, res) => {
    const { resourceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return res.status(400).json({ message: "Invalid resource id." });
    }

    try {
        const resource = await buildManagedResource(resourceId);

        if (!resource) {
            return res.status(404).json({ message: "Resource not found." });
        }

        return res.json(resource);
    } catch (error) {
        console.error("Failed to load managed resource:", error);
        return res.status(500).json({ message: "Failed to load resource." });
    }
});

router.patch('/resources/:resourceId', async (req, res) => {
    const { resourceId } = req.params;
    const name = normalizeOptionalString(req.body?.name);

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return res.status(400).json({ message: "Invalid resource id." });
    }

    if (!name) {
        return res.status(400).json({ message: "Resource name is required." });
    }

    try {
        const resource = await Resource.findByIdAndUpdate(
            resourceId,
            { name },
            { new: true }
        );

        if (!resource) {
            return res.status(404).json({ message: "Resource not found." });
        }

        return res.json(await buildManagedResource(resourceId));
    } catch (error) {
        console.error("Failed to update resource:", error);
        return res.status(500).json({ message: "Failed to update resource." });
    }
});

router.post('/resources/:resourceId/courses', async (req, res) => {
    const { resourceId } = req.params;
    const courseId = normalizeOptionalString(req.body?.courseId);
    const resourceType = normalizeOptionalString(req.body?.resourceType) || "resources";

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return res.status(400).json({ message: "Invalid resource id." });
    }

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: "A valid course is required." });
    }

    if (!isValidResourceType(resourceType)) {
        return res.status(400).json({ message: "Invalid resource type." });
    }

    try {
        const [resource, course] = await Promise.all([
            Resource.findById(resourceId),
            Course.findById(courseId)
        ]);

        if (!resource) {
            return res.status(404).json({ message: "Resource not found." });
        }

        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }

        const targetField = getCourseResourceField(resourceType);
        const otherField = targetField === "resources" ? "PYQs" : "resources";

        course[otherField].pull(resource._id);

        if (!course[targetField].some((id) => id.equals(resource._id))) {
            course[targetField].push(resource._id);
        }

        await course.save();

        return res.status(201).json(await buildManagedResource(resourceId));
    } catch (error) {
        console.error("Failed to link resource to course:", error);
        return res.status(500).json({ message: "Failed to link resource to course." });
    }
});

router.patch('/resources/:resourceId/courses/:courseId', async (req, res) => {
    const { resourceId, courseId } = req.params;
    const resourceType = normalizeOptionalString(req.body?.resourceType);

    if (!mongoose.Types.ObjectId.isValid(resourceId) || !mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: "Invalid resource or course id." });
    }

    if (!isValidResourceType(resourceType)) {
        return res.status(400).json({ message: "Invalid resource type." });
    }

    try {
        const [resource, course] = await Promise.all([
            Resource.findById(resourceId),
            Course.findById(courseId)
        ]);

        if (!resource) {
            return res.status(404).json({ message: "Resource not found." });
        }

        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }

        const isLinked = course.resources.some((id) => id.equals(resource._id)) ||
            course.PYQs.some((id) => id.equals(resource._id));

        if (!isLinked) {
            return res.status(404).json({ message: "Resource is not linked to this course." });
        }

        const targetField = getCourseResourceField(resourceType);
        const otherField = targetField === "resources" ? "PYQs" : "resources";

        course[otherField].pull(resource._id);

        if (!course[targetField].some((id) => id.equals(resource._id))) {
            course[targetField].push(resource._id);
        }

        await course.save();

        return res.json(await buildManagedResource(resourceId));
    } catch (error) {
        console.error("Failed to update resource course link:", error);
        return res.status(500).json({ message: "Failed to update course link." });
    }
});

router.delete('/resources/:resourceId/courses/:courseId', async (req, res) => {
    const { resourceId, courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(resourceId) || !mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: "Invalid resource or course id." });
    }

    try {
        const [resource, course] = await Promise.all([
            Resource.findById(resourceId),
            Course.findById(courseId)
        ]);

        if (!resource) {
            return res.status(404).json({ message: "Resource not found." });
        }

        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }

        course.resources.pull(resource._id);
        course.PYQs.pull(resource._id);
        await course.save();

        return res.json(await buildManagedResource(resourceId));
    } catch (error) {
        console.error("Failed to remove resource course link:", error);
        return res.status(500).json({ message: "Failed to remove course link." });
    }
});

router.delete('/resources/:resourceId', async (req, res) => {
    const { resourceId } = req.params;
    const shouldDeleteFile = req.query.deleteFile === "true";

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return res.status(400).json({ message: "Invalid resource id." });
    }

    try {
        const resource = await Resource.findById(resourceId);

        if (!resource) {
            return res.status(404).json({ message: "Resource not found." });
        }

        if (shouldDeleteFile && resource.AWSKey) {
            try {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: BUCKET,
                    Key: resource.AWSKey
                }));
            } catch (error) {
                console.error("Failed to delete resource file from S3:", error);
                return res.status(502).json({ message: "Deleting the stored file failed. The resource was not changed." });
            }
        }

        await Course.updateMany(
            {
                $or: [
                    { resources: resource._id },
                    { PYQs: resource._id }
                ]
            },
            {
                $pull: {
                    resources: resource._id,
                    PYQs: resource._id
                }
            }
        );

        await UserUpload.updateMany(
            { publishedResourceId: resource._id },
            { $set: { publishedResourceId: null } }
        );

        await Resource.findByIdAndDelete(resource._id);

        return res.json({ deletedResourceId: resource._id });
    } catch (error) {
        console.error("Failed to delete resource:", error);
        return res.status(500).json({ message: "Failed to delete resource." });
    }
});

router.get('/contributions', async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status.trim().toLowerCase() : "pending";

    if (!["all", "pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status filter." });
    }

    try {
        const contributions = await buildContributionList(status);
        return res.json(contributions);
    } catch (error) {
        console.error("Failed to load contributions:", error);
        return res.status(500).json({ message: "Failed to load contributions." });
    }
});

router.patch('/contributions/:id', async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid contribution id." });
    }

    if (req.body?.resourceType && !isValidContributionType(req.body.resourceType)) {
        return res.status(400).json({ message: "Invalid resource type." });
    }

    if (req.body?.targetCourseId && !mongoose.Types.ObjectId.isValid(req.body.targetCourseId)) {
        return res.status(400).json({ message: "Invalid target course id." });
    }

    try {
        const contribution = await UserUpload.findById(id);

        if (!contribution) {
            return res.status(404).json({ message: "Contribution not found." });
        }

        applyContributionEdits(contribution, req.body);
        contribution.reviewedAt = new Date();
        contribution.reviewedByProfileId = req.user.profileId;

        await contribution.save();

        const [updatedContribution] = await buildContributionList("all").then((items) =>
            items.filter((item) => item._id.toString() === id)
        );

        return res.json(updatedContribution || contribution);
    } catch (error) {
        console.error("Failed to update contribution:", error);
        return res.status(500).json({ message: "Failed to update contribution." });
    }
});

router.post('/contributions/:id/reject', async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid contribution id." });
    }

    try {
        const contribution = await UserUpload.findById(id);

        if (!contribution) {
            return res.status(404).json({ message: "Contribution not found." });
        }

        applyContributionEdits(contribution, req.body);
        contribution.status = "rejected";
        contribution.reviewedAt = new Date();
        contribution.reviewedByProfileId = req.user.profileId;

        await contribution.save();

        const [updatedContribution] = await buildContributionList("all").then((items) =>
            items.filter((item) => item._id.toString() === id)
        );

        return res.json(updatedContribution || contribution);
    } catch (error) {
        console.error("Failed to reject contribution:", error);
        return res.status(500).json({ message: "Failed to reject contribution." });
    }
});

router.post('/contributions/:id/approve', async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid contribution id." });
    }

    if (req.body?.resourceType && !isValidContributionType(req.body.resourceType)) {
        return res.status(400).json({ message: "Invalid resource type." });
    }

    if (!req.body?.targetCourseId || !mongoose.Types.ObjectId.isValid(req.body.targetCourseId)) {
        return res.status(400).json({ message: "A valid target course is required." });
    }

    try {
        const contribution = await UserUpload.findById(id);

        if (!contribution) {
            return res.status(404).json({ message: "Contribution not found." });
        }

        if (contribution.status === "approved" && contribution.publishedResourceId) {
            return res.status(400).json({ message: "Contribution has already been approved." });
        }

        applyContributionEdits(contribution, req.body);

        const targetCourse = await Course.findById(req.body.targetCourseId);

        if (!targetCourse) {
            return res.status(404).json({ message: "Target course not found." });
        }

        const resourceName = contribution.resourceName || contribution.originalFileName;
        const canonicalType = contribution.resourceType === "pyqs" ? "pyqs" : "resources";

        const resource = await Resource.create({
            dataType: contribution.mimeType || "application/octet-stream",
            name: resourceName,
            AWSKey: contribution.AWSKey,
            isEmbedded: false
        });

        const targetArray = canonicalType === "pyqs" ? "PYQs" : "resources";
        targetCourse[targetArray].push(resource._id);
        await targetCourse.save();

        try {
            await enqueueResourceForIngestion(resource._id);
        } catch (error) {
            targetCourse[targetArray].pull(resource._id);
            await Promise.all([
                targetCourse.save(),
                Resource.findByIdAndDelete(resource._id)
            ]);

            console.error("Failed to queue approved contribution for ingestion:", error);
            return res.status(502).json({ message: "Queueing ingestion failed, so the contribution approval was not completed." });
        }

        contribution.courseCode = targetCourse.id;
        contribution.courseName = targetCourse.name;
        contribution.branch = targetCourse.branch;
        contribution.semester = String(targetCourse.semester);
        contribution.targetCourseId = targetCourse._id;
        contribution.publishedResourceId = resource._id;
        contribution.status = "approved";
        contribution.reviewedAt = new Date();
        contribution.reviewedByProfileId = req.user.profileId;

        await contribution.save();

        const [updatedContribution] = await buildContributionList("all").then((items) =>
            items.filter((item) => item._id.toString() === id)
        );

        return res.json(updatedContribution || contribution);
    } catch (error) {
        console.error("Failed to approve contribution:", error);
        return res.status(500).json({ message: "Failed to approve contribution." });
    }
});

export default router;
