import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixEmailIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chess-admin');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Drop the old email index
        try {
            await usersCollection.dropIndex('email_1');
            console.log('✓ Dropped old email_1 index');
        } catch (error) {
            console.log('Index email_1 does not exist or already dropped');
        }

        // Create new sparse unique index
        await usersCollection.createIndex(
            { email: 1 },
            { unique: true, sparse: true }
        );
        console.log('✓ Created new sparse unique index on email');

        console.log('\n✅ Email index fixed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

fixEmailIndex();
