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
    },
    { timestamp: true }
)

// Pre saving middleware to update timestamps
sessionSchema.pre('save', function (next) {
    this.updatedAt = Date.now()
    next()
})

module.exports = mongoose.model('Session', sessionSchema)
