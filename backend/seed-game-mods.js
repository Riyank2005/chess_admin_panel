import mongoose from 'mongoose';
import GameMod from './models/GameMod.js';
import dotenv from 'dotenv';

dotenv.config();

const seedGameMods = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chess-master');
        
        console.log('🌱 Seeding Game Moderation Data...\n');

        // Clear existing mods
        await GameMod.deleteMany({});

        // Create valid ObjectIds for games
        const gameIds = [
            new mongoose.Types.ObjectId(),
            new mongoose.Types.ObjectId(),
            new mongoose.Types.ObjectId(),
            new mongoose.Types.ObjectId(),
            new mongoose.Types.ObjectId(),
            new mongoose.Types.ObjectId()
        ];

        const gameMods = [
            {
                gameId: gameIds[0],
                whitePlayer: 'Magnus_C',
                blackPlayer: 'Cheater123',
                reason: 'ENGINE_USE',
                severity: 'HIGH',
                status: 'FLAGGED',
                reportedBy: 'admin',
                notes: 'Suspicious move pattern detected - AI analysis shows 99% engine correlation'
            },
            {
                gameId: gameIds[1],
                whitePlayer: 'BotPlayer99',
                blackPlayer: 'ModeratorJohn',
                reason: 'ENGINE_USE',
                severity: 'HIGH',
                status: 'TERMINATED',
                reportedBy: 'system',
                notes: 'Account shows 3000+ Elo with inhuman accuracy rate'
            },
            {
                gameId: gameIds[2],
                whitePlayer: 'SuspiciousPlayer',
                blackPlayer: 'Hikaru_N',
                reason: 'STALLING',
                severity: 'MEDIUM',
                status: 'UNDER_REVIEW',
                reportedBy: 'system',
                notes: 'Unusual rating gain - 400+ points in 1 week'
            },
            {
                gameId: gameIds[3],
                whitePlayer: 'Magnus_C',
                blackPlayer: 'NewbiePlayer',
                reason: 'OTHER',
                severity: 'LOW',
                status: 'CLEARED',
                reportedBy: 'system',
                notes: 'Fair play - Normal game with no suspicious activity'
            },
            {
                gameId: gameIds[4],
                whitePlayer: 'Riyank12344',
                blackPlayer: 'BotPlayer99',
                reason: 'ENGINE_USE',
                severity: 'HIGH',
                status: 'FLAGGED',
                reportedBy: 'player',
                notes: 'Opponent suspected of using engine assistance'
            },
            {
                gameId: gameIds[5],
                whitePlayer: 'ModeratorJohn',
                blackPlayer: 'Cheater123',
                reason: 'HARASSMENT',
                severity: 'HIGH',
                status: 'TERMINATED',
                reportedBy: 'system',
                notes: 'Player banned for abusive conduct and cheating suspicions'
            }
        ];

        const createdMods = await GameMod.create(gameMods);
        
        console.log(`\n╔════════════════════════════════════════════════════════╗`);
        console.log(`║    ✅ GAME MODERATIONS SEEDED SUCCESSFULLY ✅          ║`);
        console.log(`╠════════════════════════════════════════════════════════╣`);
        console.log(`║  Total Cases: ${createdMods.length.toString().padEnd(42)}║`);
        console.log(`║  Flagged: 2 | Terminated: 2 | Under Review: 1        ║`);
        console.log(`║  Cleared: 1                                            ║`);
        console.log(`╚════════════════════════════════════════════════════════╝\n`);

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding game mods:', error.message);
        process.exit(1);
    }
};

seedGameMods();
