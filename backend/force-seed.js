import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from './models/Player.js';
import * as bcrypt from 'bcryptjs';

console.log('Starting seed script...');

dotenv.config();

const users = [
    {
        username: 'GrandmasterFlash',
        email: 'gm@chess.com',
        password: 'password123',
        elo: 2800,
        role: 'admin',
        status: 'active',
        games: 1542,
        wins: 1200,
        losses: 100,
        draws: 242,
        fairPlayRiskScore: 5
    },
    {
        username: 'RookieMove',
        email: 'rookie@chess.com',
        password: 'password123',
        elo: 1200,
        role: 'user',
        status: 'active',
        games: 50,
        wins: 20,
        losses: 25,
        draws: 5,
        fairPlayRiskScore: 10
    },
    {
        username: 'CheaterX',
        email: 'sus@chess.com',
        password: 'password123',
        elo: 3000,
        role: 'user',
        status: 'banned',
        games: 20,
        wins: 20,
        losses: 0,
        draws: 0,
        fairPlayRiskScore: 99
    },
    {
        username: 'ShadowKing',
        email: 'shadow@chess.com',
        password: 'password123',
        elo: 2100,
        role: 'user',
        status: 'active',
        isShadowBanned: true,
        games: 400,
        wins: 200,
        losses: 150,
        draws: 50,
        fairPlayRiskScore: 45
    },
    {
        username: 'MagnusFan',
        email: 'carlsen@chess.com',
        password: 'password123',
        elo: 2400,
        role: 'user',
        status: 'active',
        games: 300,
        wins: 150,
        losses: 100,
        draws: 50,
        fairPlayRiskScore: 12
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chess-dev');
        console.log('Connected to MongoDB');

        const existingCount = await Player.countDocuments();
        if (existingCount > 0) {
            console.log(`Database already has ${existingCount} players. Skipping seed.`);
            process.exit(0);
        }

        console.log('Seeding database with test users...');

        // Hash passwords
        const hashedUsers = await Promise.all(users.map(async (user) => {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
            return user;
        }));

        await Player.insertMany(hashedUsers);
        console.log('✅ Database seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedDB();
