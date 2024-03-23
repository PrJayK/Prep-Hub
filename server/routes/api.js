const { UserGoogle, Course } = require('../db/db');
const { isLoggedIn } = require('../middleware/auth');

const router = require('express').Router();

router.get('/getEnrolledCourses', isLoggedIn, async (req, res) => {
    const profile_id = req.session.passport.user.id;

    const existingUser = await UserGoogle.findOne({profile_id: profile_id});

    if(!existingUser) {
        return res.sendStatus(401);
    }

    existingUser.populate(enrollecCourses);

    res.json(existingUser.enrolledCourses);
});

// router.get('/getCourse', isLoggedIn, async (req, res) => {
//     const profile_id = req.session.passport.user.id;

//     const courseId = req.body.courseId;

//     const existingUser = await UserGoogle.findOne({profile_id: profile_id, enrolledCourses: courseId});

//     if(!existingUser) {
//         return res.sendStatus(401);
//     }

//     res.json(existingUser.enrolledCourses.courseId);
// });

module.exports = router;