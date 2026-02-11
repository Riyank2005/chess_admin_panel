import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Game from './models/Game.js';
import Player from './models/Player.js';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const games = [
    {
        white: "Magnus_C",
        black: "Hikaru_N",
        whiteElo: "2880",
        blackElo: "2865",
        timeControl: "5+0",
        moves: "14",
        duration: "0:45",
        status: "playing",
        pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6"
    },
    {
        white: "Fabiano_C",
        black: "Ding_L",
        whiteElo: "2775",
        blackElo: "2760",
        timeControl: "3+2",
        moves: "8",
        duration: "0:15",
        status: "playing",
        pgn: "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O"
    },
    {
        white: "Ian_N",
        black: "Wesley_S",
        whiteElo: "2750",
        blackElo: "2730",
        timeControl: "10+0",
        moves: "5",
        duration: "0:07",
        status: "playing",
        pgn: "1. e4 c5 2. Nf3 d6 3. d4 cxd4"
    },
    {
        white: "Anish_G",
        black: "Levon_A",
        whiteElo: "2805",
        blackElo: "2790",
        timeControl: "15+10",
        moves: "18",
        duration: "1:25",
        status: "paused",
        pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5"
    },
];

const users = [
    {
        username: "Magnus_C",
        email: "magnus@chess.com",
        phone: "1234567890",
        password: "password123",
        elo: 2880,
        games: 12456,
        wins: 8123,
        losses: 2765,
        draws: 1568,
        status: "active",
        role: "admin",
        isVerified: true,
        coordinates: { lat: 59.91, lon: 10.75 }, // Oslo
        fairPlayRiskScore: 5
    },
    {
        username: "Hikaru_N",
        email: "hikaru@chess.com",
        phone: "1234567891",
        password: "password123",
        elo: 2865,
        games: 14321,
        wins: 9021,
        losses: 3210,
        draws: 2090,
        status: "active",
        role: "player",
        isVerified: true,
        coordinates: { lat: 34.05, lon: -118.24 }, // LA
        fairPlayRiskScore: 12
    },
    {
        username: "ModeratorJohn",
        email: "john@chess.com",
        phone: "1234567892",
        password: "password123",
        elo: 2100,
        games: 542,
        wins: 301,
        losses: 190,
        draws: 51,
        status: "active",
        role: "moderator",
        isVerified: true,
        coordinates: { lat: 51.50, lon: -0.12 }, // London
        fairPlayRiskScore: 2
    },
    {
        username: "Cheater123",
        email: "banned@chess.com",
        phone: "1234567893",
        password: "password123",
        elo: 1850,
        games: 97,
        wins: 64,
        losses: 28,
        draws: 5,
        status: "banned",
        role: "player",
        isVerified: true,
        coordinates: { lat: 55.75, lon: 37.61 }, // Moscow
        fairPlayRiskScore: 95
    },
];

const seedData = async () => {
    try {
        await Game.deleteMany();
        await Player.deleteMany();

        await Player.insertMany(users);
        await Game.insertMany(games);

        console.log('System Data Synchronized with PGN payloads.');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

seedData();
