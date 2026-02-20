import mongoose from 'mongoose';

const reportSchema = mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true
    },
    reported: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true
    },
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
    },
    reason: {
        type: String,
        required: true,
        enum: ['ENGINE_ASSISTANCE', 'HARASSMENT', 'STALLING_TIME', 'ABUSIVE_LANGUAGE', 'OTHER']
    },
    evidence: {
        type: String // Optional description or PGN snippet
    },
    status: {
        type: String,
        enum: ['PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED'],
        default: 'PENDING'
    },
    adminNotes: String,
    appeal: {
        description: String,
        status: {
            type: String,
            enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
            default: 'NONE'
        },
        date: Date
    }
}, {
    timestamps: true
});

const Report = mongoose.model('Report', reportSchema);
export default Report;
