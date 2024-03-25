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

    console.log(existingUser.enrolledCourses);
    res.json(existingUser.enrolledCourses);
});

router.post('/addToEnrolledCourses', isLoggedIn, async (req, res) => {
    const profile_id = req.session.passport.user.id;

    const existingUser = await UserGoogle.findOne({profile_id: profile_id});

    if(!existingUser) {
        return res.sendStatus(401);
    }
    
    const updatedUser = await UserGoogle.findOneAndUpdate(
        { profile_id: profile_id },
        { $push: { enrolledCourses: courseId } },
        { new: true }
    );

    if (!updatedUser) {
        return res.sendStatus(401);
    }

    console.log(updatedUser);

    res.sendStatus(201);
});
module.exports = router;