import mongoose from 'mongoose';
import Player from './models/Player.js';
import dotenv from 'dotenv';

dotenv.config();

const checkDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chess-dev');

        const count = await Player.countDocuments();
        console.log(`\n📊 DATABASE STATUS:`);
        console.log(`------------------`);
        console.log(`Total Players found: ${count}`);

        if (count > 0) {
            const players = await Player.find().limit(5).select('username email role status');
            console.log('\nFirst 5 players:');
            console.table(players.map(p => ({
                id: p._id.toString(),
                username: p.username,
                email: p.email,
                status: p.status
            })));
        } else {
            console.log('\n❌ The database is EMPTY. This is why no players are fetching.');
            console.log('👉 Please calculate "node backend/seed-users.js" to fix this.');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error connecting to DB:', error);
    }
};

checkDb();
