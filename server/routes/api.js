import { Router } from 'express';
import { UserGoogle, Course, Resource, UserUpload } from '../db/db.js';
import { isLoggedIn } from '../middleware/auth.js';
import { awsRouter } from './aws.js';
import { chatRouter } from './chat.routes.js';

const router = Router();

router.use('/aws', awsRouter);

router.use('/chat', chatRouter);

router.get('/search', isLoggedIn, async (req, res) => {
    const query = req.query.q;

    //TODO: implement semantic search later.

    const matchStage = {};

    const results = await Resource.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: "courses",
                let: { resourceId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $or: [
                                    { $in: ["$$resourceId", "$PYQs"] },
                                    { $in: ["$$resourceId", "$resources"] }
                                ]
                            }
                        }
                    },
                    {
                        $project: { id: 1, name: 1 }
                    }
                ],
                as: "courses"
            }
        }
    ]);

    res.json(results);

    console.log(results);
});

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

    const existingUser = await UserGoogle.findOne({ profile_id })
    .populate({
        path: 'enrolledCourses',
        populate: [
            { path: 'PYQs', model: 'Resource' },
            { path: 'resources', model: 'Resource' }
        ]
    })
    .exec();

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

router.post('/userContribute', isLoggedIn, async (req, res) => {
    const profile_id = req.session.passport.user.id;
    const { courseId, resourceName, resourceType, branch, semester, key } = req.body;
    
    if(!courseId || !resourceName || !resourceType || !branch || !semester || !key) {
        return res.sendStatus(404);
    }

    const userUpload = await UserUpload.create({
        profile_id,
        courseId,
        resourceName,
        resourceType,
        branch,
        semester,
        AWSKey: key
    });
    
    if(!userUpload) {
        return res.sendStatus(401);
    }
    
    return res.status(201).json({
        message: 'uploaded successfully!'
    });
});

export default router;
