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
        linkToAWS: {
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
        linkTOAWS: {
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
})


const UserGoogle = mongoose.model('UserGoogle', GoogleUserSchema);
const Course = mongoose.model('Course', CourseSchema);

module.exports = {
    UserGoogle,
    Course,
    mongoUrl
};