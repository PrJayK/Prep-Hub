import { Router } from 'express';

import { Course, Resource } from '../db/db.js';
import { isLoggedIn } from '../middleware/auth.js';
import { embedder } from '../config/embedder.config.js';
import { getNonPopulatedEnrolledCoursesForUser } from '../services/courses/courses.service.js';
import { retrieveTopK } from '../services/rag/retriever.js';

const router = Router();

const SEARCH_CANDIDATE_LIMIT = 100;
const SEARCH_RESULTS_PER_GROUP = 10;

function normalizeCourseIds(courseIds) {
    if (!Array.isArray(courseIds)) {
        return [];
    }

    return courseIds.map((courseId) => courseId?.toString()).filter(Boolean);
}

function buildSearchResult(chunk, score, courseId, resourceMap, courseMap) {
    if (!chunk?.metadata?.resourceId || !courseId) {
        return null;
    }

    const resource = resourceMap.get(chunk.metadata.resourceId);
    const course = courseMap.get(courseId);

    return {
        pageContent: chunk.pageContent,
        similarityScore: score,
        resourceId: chunk.metadata.resourceId,
        resourceName: resource?.name || chunk.metadata.name || 'Untitled resource',
        dataType: resource?.dataType || chunk.metadata.dataType || 'unknown',
        awsKey: resource?.AWSKey || '',
        resourceContent: resource?.content || '',
        courseId,
        courseName: course?.name || 'Unknown course',
        pageNumber:
            typeof chunk.metadata.pageNumber === 'number' ? chunk.metadata.pageNumber : null,
        startChar:
            typeof chunk.metadata.startChar === 'number' ? chunk.metadata.startChar : null,
        endChar:
            typeof chunk.metadata.endChar === 'number' ? chunk.metadata.endChar : null,
    };
}

router.get('/search', isLoggedIn, async (req, res) => {
    const searchQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    if (!searchQuery) {
        return res.status(400).json({ message: 'Query is required.' });
    }

    try {
        const { enrolledCourses } = await getNonPopulatedEnrolledCoursesForUser(req.session.passport.user.id);
        const enrolledCourseIds = enrolledCourses.map((course) => course._id.toString());
        const enrolledCourseIdSet = new Set(enrolledCourseIds);

        const queryEmbeddings = await embedder.embedQuery(searchQuery);
        const candidateChunks = await retrieveTopK(queryEmbeddings, SEARCH_CANDIDATE_LIMIT);

        const enrolledMatches = [];
        const nonEnrolledMatches = [];
        const selectedResourceIds = new Set();
        const selectedCourseIds = new Set();

        for (const [chunk, score] of candidateChunks) {
            const courseIds = normalizeCourseIds(chunk?.metadata?.courseIds);

            if (courseIds.length === 0) {
                continue;
            }

            const enrolledCourseId = courseIds.find((courseId) => enrolledCourseIdSet.has(courseId));
            const nonEnrolledCourseId = courseIds.find((courseId) => !enrolledCourseIdSet.has(courseId));

            if (enrolledCourseId && enrolledMatches.length < SEARCH_RESULTS_PER_GROUP) {
                enrolledMatches.push({ chunk, score, courseId: enrolledCourseId });
                selectedResourceIds.add(chunk.metadata.resourceId);
                selectedCourseIds.add(enrolledCourseId);
            }

            if (!enrolledCourseId && nonEnrolledCourseId && nonEnrolledMatches.length < SEARCH_RESULTS_PER_GROUP) {
                nonEnrolledMatches.push({ chunk, score, courseId: nonEnrolledCourseId });
                selectedResourceIds.add(chunk.metadata.resourceId);
                selectedCourseIds.add(nonEnrolledCourseId);
            }

            if (
                enrolledMatches.length >= SEARCH_RESULTS_PER_GROUP &&
                nonEnrolledMatches.length >= SEARCH_RESULTS_PER_GROUP
            ) {
                break;
            }
        }

        const [resources, courses] = await Promise.all([
            Resource.find({ _id: { $in: Array.from(selectedResourceIds) } })
                .select('_id name dataType AWSKey content')
                .lean(),
            Course.find({ _id: { $in: Array.from(selectedCourseIds) } })
                .select('_id name')
                .lean(),
        ]);

        const resourceMap = new Map(resources.map((resource) => [resource._id.toString(), resource]));
        const courseMap = new Map(courses.map((course) => [course._id.toString(), course]));

        res.json({
            query: searchQuery,
            enrolledResults: enrolledMatches
                .map(({ chunk, score, courseId }) =>
                    buildSearchResult(chunk, score, courseId, resourceMap, courseMap)
                )
                .filter(Boolean),
            nonEnrolledResults: nonEnrolledMatches
                .map(({ chunk, score, courseId }) =>
                    buildSearchResult(chunk, score, courseId, resourceMap, courseMap)
                )
                .filter(Boolean),
        });
    } catch (error) {
        console.error('Search failed:', error);
        res.status(500).json({ message: 'Failed to search resources.' });
    }
});

export default router;
