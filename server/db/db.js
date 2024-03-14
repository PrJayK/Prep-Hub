const mongoose = require('mongoose');


console.log("Connecting to the Database");
// Connect to MongoDB
mongoose.connect('mongodb+srv://prajwal:VSu18jbY4dzRgTAZ@learn-test.qjtlyhm.mongodb.net/Prep-Hub')
    .then( () => {
        console.log("Connected!");
        });

const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    name: String,   
    enrolledCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }]
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
});

const CourseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    PYQs: {
        type: [String]
    },
    imageLink: {
        type: String
    }

})

const User = mongoose.model('User', UserSchema);
const UserGoogle = mongoose.model('UserGoogle', GoogleUserSchema);
const Course = mongoose.model('Course', CourseSchema);

module.exports = {
    User,
    UserGoogle,
    Course
};