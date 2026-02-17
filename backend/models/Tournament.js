import mongoose from 'mongoose';

const tournamentSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    timeControl: {
        type: String,
        required: true,
        enum: ['1+0', '3+0', '10+0', '30+0']
    },
    players: {
        type: Number,
        default: 0
    },
    maxPlayers: {
        type: Number,
        required: true,
        default: 64
    },
    prize: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'registering', 'live', 'completed'],
        default: 'draft'
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    registrationEndDate: {
        type: Date,
        required: true
    },
    currentRound: {
        type: Number,
        default: 0
    },
    totalRounds: {
        type: Number,
        default: 5
    },
    enrolledPlayers: [{
        player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        username: String,
        elo: Number,
        points: { type: Number, default: 0 },
        isEliminated: { type: Boolean, default: false }
    }],
    rounds: [{
        roundNumber: Number,
        pairings: [{
            white: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
            black: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
            result: { type: String, enum: ['1-0', '0-1', '1/2-1/2', 'pending'], default: 'pending' },
            gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' }
        }]
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

const Tournament = mongoose.model('Tournament', tournamentSchema);

export default Tournament;
