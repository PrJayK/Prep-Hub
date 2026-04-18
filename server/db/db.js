import { index } from '@langchain/core/indexing';
import env from '../config/env.js';
import mongoose from 'mongoose';

console.log("Connecting to the Database");

const MONGO_URL = env.MONGO_URL;

mongoose.connect(MONGO_URL)
    .then( () => {
        console.log("Connected!");
        });

const GoogleUserSchema = new mongoose.Schema({
    profileId: {
        type: String,
        required: true,
        index: true
    },
    email: {
        type: String,
        default: null
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
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
    isEmbedded: {
        type: Boolean,
        default: false
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
    profileId: {
        type: String,
        required: true
    },
    courseCode: {
        type: String,
        default: null,
        trim: true
    },
    courseName: {
        type: String,
        default: null,
        trim: true
    },
    resourceName: {
        type: String,
        default: null,
        trim: true
    },
    resourceType: {
        type: String,
        enum: ["resources", "pyqs", "other"],
        default: "resources"
    },
    branch: {
        type: String,
        default: null,
        trim: true
    },
    semester: {
        type: String,
        default: null,
        trim: true
    },
    originalFileName: {
        type: String,
        required: true,
        trim: true
    },
    mimeType: {
        type: String,
        default: "application/octet-stream"
    },
    fileSize: {
        type: Number,
        required: true,
        min: 0
    },
    AWSKey: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    adminNotes: {
        type: String,
        default: null,
        trim: true
    },
    targetCourseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        default: null
    },
    publishedResourceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource',
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    reviewedByProfileId: {
        type: String,
        default: null
    }
}, { timestamps: true });

const ConversationSchema = new mongoose.Schema({
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },

    title: {
        type: String,
        default: "New Chat"
    },

    runningContext: {
        type: String,
        default: ""
    },

    runningContextStrength: {
        type: String,
        default: "NONE"
    },

    lastMessage: {
        type: String
    },

    isDeleted: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }

}, { timestamps: true });

const MessageSourceSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    sourceId: {
        type: String,
        required: true
    },
    resourceId: {
        type: String,
        required: true
    },
    page: {
        type: Number,
        default: null
    },
    label: {
        type: String,
        required: true
    },
    preview: {
        type: String,
        default: ""
    },
    chunkIndex: {
        type: Number,
        default: null
    },
    quote: {
        type: String,
        default: null
    },
    claim: {
        type: String,
        default: null
    }
}, { _id: false });

const MessageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true
    },
    
    role: {
        type: String,
        enum: ["user", "ai", "system"],
        required: true
    },
    
    content: {
        type: String,
        required: true
    },

    sources: {
        type: [MessageSourceSchema],
        default: []
    }
    
}, { timestamps: { createdAt: true, updatedAt: false } });

ConversationSchema.index({ profileId: 1, updatedAt: -1 });
MessageSchema.index({ conversationId: 1, createdAt: -1 });

const UserGoogle = mongoose.model('UserGoogle', GoogleUserSchema);
const Course = mongoose.model('Course', CourseSchema);
const Resource = mongoose.model('Resource', ResourceSchema);
const Conversation = mongoose.model('Conversation', ConversationSchema);
const Message = mongoose.model('Message', MessageSchema);
const UserUpload = mongoose.model('UserUpload', UserUploadSchema);

export {
    UserGoogle,
    Course,
    Resource,
    Conversation,
    Message,
    UserUpload,
    MONGO_URL
};
