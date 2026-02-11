import mongoose from 'mongoose';
import Player from './models/Player.js';
import dotenv from 'dotenv';

dotenv.config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chess-master');
        
        console.log('🌱 Seeding Player Users...\n');

        // Clear existing players
        await Player.deleteMany({});

        const players = [
            {
                username: 'Magnus_C',
                email: 'magnus@chess.com',
                phone: '1234567890',
                password: 'password123',
                elo: 2800,
                games: 500,
                wins: 450,
                losses: 30,
                draws: 20,
                status: 'active',
                isVerified: true,
                city: 'Oslo',
                country: 'Norway'
            },
            {
                username: 'Hikaru_N',
                email: 'hikaru@chess.com',
                phone: '1234567891',
                password: 'password123',
                elo: 2750,
                games: 450,
                wins: 400,
                losses: 35,
                draws: 15,
                status: 'active',
                isVerified: true,
                city: 'St. Louis',
                country: 'USA'
            },
            {
                username: 'Cheater123',
                email: 'cheater@chess.com',
                phone: '1234567892',
                password: 'password123',
                elo: 2500,
                games: 300,
                wins: 280,
                losses: 15,
                draws: 5,
                status: 'banned',
                isVerified: true,
                city: 'Unknown',
                country: 'Unknown',
                fairPlayRiskScore: 95
            },
            {
                username: 'Riyank12344',
                email: 'riyank@chess.com',
                phone: '1234567893',
                password: 'password123',
                elo: 2600,
                games: 350,
                wins: 320,
                losses: 25,
                draws: 5,
                status: 'active',
                isVerified: true,
                city: 'New Delhi',
                country: 'India'
            },
            {
                username: 'SuspiciousPlayer',
                email: 'suspicious@chess.com',
                phone: '1234567894',
                password: 'password123',
                elo: 2550,
                games: 200,
                wins: 180,
                losses: 15,
                draws: 5,
                status: 'active',
                isVerified: true,
                fairPlayRiskScore: 78
            },
            {
                username: 'NewbiePlayer',
                email: 'newbie@chess.com',
                phone: '1234567895',
                password: 'password123',
                elo: 1200,
                games: 50,
                wins: 20,
                losses: 25,
                draws: 5,
                status: 'active',
                isVerified: true,
                city: 'London',
                country: 'UK'
            },
            {
                username: 'BotPlayer99',
                email: 'bot@chess.com',
                phone: '1234567896',
                password: 'password123',
                elo: 3000,
                games: 1000,
                wins: 950,
                losses: 30,
                draws: 20,
                status: 'active',
                isVerified: true,
                fairPlayRiskScore: 99
            },
            {
                username: 'ModeratorJohn',
                email: 'mod@chess.com',
                phone: '1234567897',
                password: 'password123',
                elo: 2400,
                games: 400,
                wins: 350,
                losses: 40,
                draws: 10,
                status: 'active',
                isVerified: true,
                city: 'Paris',
                country: 'France'
            }
        ];

        const createdPlayers = await Player.create(players);
        
        console.log(`\n╔════════════════════════════════════════════════════════╗`);
        console.log(`║         ✅ PLAYERS SEEDED SUCCESSFULLY ✅              ║`);
        console.log(`╠════════════════════════════════════════════════════════╣`);
        console.log(`║  Total Players: ${createdPlayers.length.toString().padEnd(42)}║`);
        createdPlayers.forEach((player, idx) => {
            console.log(`║  ${(idx + 1)}. ${player.username.padEnd(50)}║`);
        });
        console.log(`╚════════════════════════════════════════════════════════╝\n`);

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
