const mongoose = require('mongoose');
const { Schema } = mongoose;

const contestSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    hostId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    problems: [{
        type: Schema.Types.ObjectId,
        ref: 'problem'
    }],
    duration: {
        type: Number, // in minutes
        required: true
    },
    startTime: {
        type: Date, // Global start time
        required: true
    },
    participants: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        score: {
            type: Number,
            default: 0
        },
        penaltyTime: {
            type: Number, // total minutes
            default: 0
        },
        solvedProblems: [{
            type: Schema.Types.ObjectId,
            ref: 'problem'
        }]
    }]
}, {
    timestamps: true
});

const Contest = mongoose.model('contest', contestSchema);

module.exports = Contest;
