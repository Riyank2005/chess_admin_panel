import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const createAdmin = async () => {
    try {
        // Clear existing admins (optional)
        await Admin.deleteMany({});
        console.log('Cleared existing admins');

        // Create admin account
        const admin = await Admin.create({
            username: 'admin',
            email: 'admin@chess.com',
            password: 'admin123',
            clearanceLevel: 'SUPER_ADMIN'
        });

        console.log(`\n✅ Admin account created successfully!\n`);
        console.log(`📋 Admin Details:`);
        console.log(`   Username: admin`);
        console.log(`   Email: admin@chess.com`);
        console.log(`   Password: admin123`);
        console.log(`   Clearance Level: SUPER_ADMIN\n`);
        console.log(`🔐 You can now login with these credentials at /login\n`);

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
