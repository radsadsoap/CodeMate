const mongoose = require('mongoose')

const sessionSchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true,
            unique: true,
        },
        linkShare: {
            type: String,
            unique: true,
        },
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        codeHistory: [
            {
                code: String,
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
                author: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        language: {
            type: String,
            enum: ['python', 'java', 'cpp'],
            default: 'python',
        },
        raisedHands: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        endedAt: { type: Date },
        currentCode: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Session', sessionSchema)
