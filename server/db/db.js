const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://prajwal:VSu18jbY4dzRgTAZ@learn-test.qjtlyhm.mongodb.net/04-mongo-with-jwt-auth-assignment');

const UserSchema = new mongoose.Schema({
    email : String,
    password : String,
    name: String,   
    enrolledCourses : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Course'
    }]
});

const User = mongoose.model('User', UserSchema);

module.exports = {
    User
};