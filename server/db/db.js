import '../config/env.js';
import mongoose from 'mongoose';

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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource'
    }],
    resources: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource'
    }],
    branch: {
        type: String,
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    bannerKey: {
        type: String,
        required: true
    }
});

const ResourceSchema = new mongoose.Schema({
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
        required: false
    },
    content: {
        type: String,
        required: false
    },
    uploadTime: {
        type: Date,
        default: Date.now,
        required: true
    }
});

const UserUploadSchema = new mongoose.Schema({
    profile_id: {
        type: Number,
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
const Resource = mongoose.model('Resource', ResourceSchema);
const UserUpload = mongoose.model('UserUpload', UserUploadSchema);

export {
    UserGoogle,
    Course,
    Resource,
    UserUpload,
    mongoUrl
};
