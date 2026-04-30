import { Course, UserGoogle } from "../../db/db.js";

function createHttpError(message, statusCode = 500) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function getEnrolledCoursesForUser(profileId) {
    
    const existingUser = await UserGoogle.findOne({ profileId })
    .populate({
        path: 'enrolledCourses',
        populate: [
            { path: 'PYQs', model: 'Resource' },
            { path: 'resources', model: 'Resource' }
        ]
    })
    .exec();

    if(!existingUser) {
        throw new Error("User not found.");
    }

    return existingUser.enrolledCourses;
}

async function getNonPopulatedEnrolledCoursesForUser(profileId) {
    const user = await UserGoogle.findOne({ profileId })
        .populate('enrolledCourses')
        .exec();

    if (!user) {
        throw new Error("User not found.");
    }

    return { name: user.name, email: user.email, role: user.role || "user", enrolledCourses: user.enrolledCourses };
}

async function getUserInfo(profileId) {
    const user = await UserGoogle.findOne({ profileId }).exec();

    if (!user) {
        throw new Error("User not found.");
    }

    return {
        name: user.name,
        email: user.email,
        role: user.role || "user"
    };
}

async function enrollCourse(profileId, courseId) {
    
    const existingUser = await UserGoogle.findOne({ profileId });
    const existingCourse = await Course.findById(courseId);

    if(!existingUser || !existingCourse) {
        throw createHttpError("User or course not found.", 404);
    }

    if(existingUser.enrolledCourses.some((id) => id.toString() === courseId.toString())){
        return { alreadyEnrolled: true, course: existingCourse };
    }

    const updatedUser = await UserGoogle.findOneAndUpdate(
        { profileId: profileId },
        { $addToSet: { enrolledCourses: existingCourse._id } },
        { new: true }
    );

    return { updatedUser, course: existingCourse, alreadyEnrolled: false };
}

async function getAllResourcesForIngestion() {
    return Course.aggregate([
        {
            $project: {
                resources: {
                    $setUnion: ["$resources", "$PYQs"]
                }
            }
        },
        {
            $unwind: "$resources"
        },
        {
            $group: {
                _id: "$resources",
                courseIds: { $addToSet: "$_id" }
            }
        },
        {
            $lookup: {
                from: "resources",
                localField: "_id",
                foreignField: "_id",
                as: "resource"
            }
        },
        {
            $unwind: "$resource"
        },
        {
            $match: {
                "resource.isEmbedded": { $ne: true },
                $or: [
                    { "resource.content": { $type: "string", $ne: "" } },
                    { "resource.AWSKey": { $type: "string", $ne: "" } }
                ]
            }
        },
        {
            $project: {
                _id: "$resource._id",
                name: "$resource.name",
                dataType: "$resource.dataType",
                AWSKey: "$resource.AWSKey",
                content: "$resource.content",
                courseIds: 1
            }
        }
    ]);
}

export { getEnrolledCoursesForUser, getNonPopulatedEnrolledCoursesForUser, getUserInfo, enrollCourse, getAllResourcesForIngestion };
