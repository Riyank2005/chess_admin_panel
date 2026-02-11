import mongoose from 'mongoose';

const gameModSchema = mongoose.Schema({
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game',
        required: true
    },
    whitePlayer: String,
    blackPlayer: String,
    status: {
        type: String,
        enum: ['FLAGGED', 'UNDER_REVIEW', 'CLEARED', 'TERMINATED'],
        default: 'FLAGGED'
    },
    reason: {
        type: String,
        enum: ['ENGINE_USE', 'STALLING', 'ABANDONMENT', 'HARASSMENT', 'OTHER'],
        required: true
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: 'MEDIUM'
    },
    reportedBy: String,
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    decision: String,
    notes: String
}, {
    timestamps: true
});

const GameMod = mongoose.model('GameMod', gameModSchema);
export default GameMod;
