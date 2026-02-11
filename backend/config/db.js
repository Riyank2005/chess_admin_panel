import mongoose from 'mongoose';
import config from './config.js';

const connectDB = async () => {
    try {
        const mongoUri = config.mongoURI || process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/chess-admin';
        console.log(`[DB] 🔗 Connecting to MongoDB (${mongoUri.includes('localhost') ? mongoUri : '[REDACTED_URI]'} )`);

        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 5000,
        });

        console.log(`[DB] ✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`[DB] ❌ MongoDB Connection Error: ${error.message}`);
        console.error(`[DB] ⚠️  Server will continue but database features may not work`);
        console.error(`[DB] 📋 Ensure MongoDB is running: mongod`);
        // Don't exit - allow server to run without database for quick testing
    }
};

export default connectDB;
