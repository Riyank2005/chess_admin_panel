import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Game from './models/Game.js';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const debug = async () => {
    try {
        const count = await Game.countDocuments({});
        console.log('Total Games:', count);
        const playing = await Game.countDocuments({ status: 'playing' });
        console.log('Playing Games:', playing);
        const all = await Game.find({});
        console.log('Sample Status:', all[0]?.status);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

debug();
