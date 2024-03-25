const { UserGoogle, Course } = require('../db/db');
const { isLoggedIn } = require('../middleware/auth');

const router = require('express').Router();

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
    const profile_id = req.session.passport.user.id;

    const existingUser = await UserGoogle.findOne({ profile_id: profile_id }).populate('enrolledCourses').exec();


    if(!existingUser) {
        return res.sendStatus(401);
    }

    res.json(existingUser.enrolledCourses);
});

router.post('/addToEnrolledCourses', isLoggedIn, async (req, res) => {
    const profile_id = req.session.passport.user.id;
    const _id = req.body._id;
    if(!_id) {
        return res.sendStatus(404);
    }

    const existingUser = await UserGoogle.findOne({profile_id: profile_id});
    const existingCourse = await Course.findById(_id);

    if(!existingUser || !existingCourse) {
        return res.sendStatus(404);
    }

    if(existingUser.enrolledCourses.find((id) => id == _id)){
        return res.json({message: "Course already enrolled in."});
    }

    const updatedUser = await UserGoogle.findOneAndUpdate(
        { profile_id: profile_id },
        { $push: { enrolledCourses: existingCourse._id } },
        { new: true }
    );

    if (!updatedUser) {
        return res.sendStatus(401);
    }

    res.status(201).json(existingCourse);
});
module.exports = router;