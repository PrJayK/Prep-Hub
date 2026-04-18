import { Router } from 'express';

import { Course } from '../db/db.js';
import { isLoggedIn } from '../middleware/auth.js';
import {
    enrollCourse,
    getEnrolledCoursesForUser,
    getUserInfo
} from '../services/courses/courses.service.js';

const router = Router();

router.post('/queryCourses', isLoggedIn, async (req, res) => {
    const { course_query, semester, branch } = req.body;
    let query = {};

    if (course_query && course_query != "") {
        query.$or = [
            { name: { $regex: course_query, $options: 'i' } },
            { id: { $regex: course_query, $options: 'i' } }
        ];
    }

    if (semester && semester != "" && semester != "semester") {
        query.semester = semester;
    }

    if (branch && branch != "" && branch != "branch") {
        query.branch = branch;
    }

    const queriedCourses = await Course.find(query);

    const resCourses = queriedCourses.map((course) => ({
        _id: course._id,
        id: course.id,
        name: course.name,
        branch: course.branch,
        semester: course.semester
    }));

    res.json(resCourses);
});
router.get('/getEnrolledCourses', isLoggedIn, async (req, res) => {
    const profileId = req.user.profileId;
    try {
        const enrolledCourses = await getEnrolledCoursesForUser(profileId);
        res.json(enrolledCourses);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

router.post('/addToEnrolledCourses', isLoggedIn, async (req, res) => {
    const profileId = req.user.profileId;
    const _id = req.body._id;
    if(!_id) {
        return res.sendStatus(404);
    }

    const [updatedUser, existingCourse] = await enrollCourse(profileId, _id);

    if (!updatedUser) {
        return res.sendStatus(401);
    }

    res.json(existingCourse);
});

export default router;
