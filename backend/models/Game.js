import mongoose from 'mongoose';

const gameSchema = mongoose.Schema({
    white: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true
    },
    black: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true
    },
    whiteElo: {
        type: String,
        required: true
    },
    blackElo: {
        type: String,
        required: true
    },
    timeControl: {
        type: String,
        required: true
    },
    moves: {
        type: String,
        default: "0"
    },
    duration: {
        type: String,
        default: "0:00"
    },
    status: {
        type: String,
        enum: ['playing', 'paused', 'finished', 'aborted', 'drawn'],
        default: 'playing'
    },
    result: {
        type: String, // e.g., "1-0", "0-1", "1/2-1/2", "Aborted"
        default: "*"
    },
    pgn: {
        type: String
    },
    messages: [{
        sender: { type: String, required: true }, // username or 'system'
        text: { type: String, required: true },
        time: { type: Date, default: Date.now }
    }],
    drawOffer: {
        type: String, // 'white', 'black', or null
        default: null
    },
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament'
    }
}, {
    timestamps: true
});

const Game = mongoose.model('Game', gameSchema);

export default Game;
