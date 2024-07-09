const mongoose = require('mongoose');

console.log("Connecting to the Database");

const mongoUrl = process.env.mongoUrl;

mongoose.connect(mongoUrl)
    .then( () => {
        console.log("Connected!");
        });

const GoogleUserSchema = new mongoose.Schema({
    profile_id: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    enrolledCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }]
});

const CourseSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    PYQs: [{
        dataType: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        AWSKey: {
            type: String,
            required: true
        }
    }],
    resources: [{
        dataType: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        AWSKey: {
            type: String,
            required: true
        }
    }],
    branch: [{
        type: String,
        required: true
    }],
    semester: {
        type: Number,
        required: true
    },
    bannerKey: {
        type: String,
        required: true
    }
});

const UserUploadSchema = new mongoose.Schema({
    profile_id: {
        type: String,
        required: true
    },
    courseId: {
        type: String,
        required: true
    },
    resourceName: {
        type: String,
        required: true
    },
    resourceType: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    AWSKey: {
        type: String,
        required: true
    }
});


const UserGoogle = mongoose.model('UserGoogle', GoogleUserSchema);
const Course = mongoose.model('Course', CourseSchema);
const UserUpload = mongoose.model('UserUpload', UserUploadSchema);

module.exports = {
    UserGoogle,
    Course,
    UserUpload,
    mongoUrl
};