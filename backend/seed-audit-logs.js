import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AuditLog from './models/AuditLog.js';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const sampleAuditLogs = [
    {
        adminId: new mongoose.Types.ObjectId(),
        adminName: 'admin_user',
        action: 'BAN',
        target: 'CheatingPlayer123',
        details: 'User banned for engine use',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
    },
    {
        adminId: new mongoose.Types.ObjectId(),
        adminName: 'admin_user',
        action: 'BAN',
        target: 'SpammerAccount789',
        details: 'User banned for spamming chat',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12) // 12 hours ago
    },
    {
        adminId: new mongoose.Types.ObjectId(),
        adminName: 'moderator_user',
        action: 'DELETE_USER',
        target: 'InactivePlayer456',
        details: 'Inactive account deleted',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6) // 6 hours ago
    },
    {
        adminId: new mongoose.Types.ObjectId(),
        adminName: 'admin_user',
        action: 'UNBAN',
        target: 'ReformedPlayer456',
        details: 'User unbanned after appeal review',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 hours ago
    },
    {
        adminId: new mongoose.Types.ObjectId(),
        adminName: 'admin_user',
        action: 'BROADCAST',
        target: 'system_announcement',
        details: 'System maintenance scheduled for tonight',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
    },
    {
        adminId: new mongoose.Types.ObjectId(),
        adminName: 'moderator_user',
        action: 'SHADOW_BAN',
        target: 'ToxicPlayer789',
        details: 'User shadow-banned for repeated violations',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
    },
    {
        adminId: new mongoose.Types.ObjectId(),
        adminName: 'admin_user',
        action: 'SETTINGS_UPDATE',
        target: 'maintenance_mode',
        details: 'Value set to: false',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
    },
    {
        adminId: new mongoose.Types.ObjectId(),
        adminName: 'admin_user',
        action: 'GAME_TERMINATED',
        target: 'game_507f1f77bcf86cd799439011',
        details: 'Game terminated due to suspicious activity',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date(Date.now() - 1000 * 60 * 10) // 10 minutes ago
    },
];

const seedAuditLogs = async () => {
    try {
        // Clear existing audit logs
        await AuditLog.deleteMany({});
        console.log('Cleared existing audit logs');

        // Insert sample logs
        const result = await AuditLog.insertMany(sampleAuditLogs);
        console.log(`✅ Successfully seeded ${result.length} audit logs`);

        // Show what was created
        const logs = await AuditLog.find({}).sort({ createdAt: -1 });
        console.log('\n📋 Created Audit Logs:');
        logs.forEach((log, index) => {
            console.log(`${index + 1}. [${log.action}] ${log.adminName} → ${log.target} (${log.details})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error seeding audit logs:', error);
        process.exit(1);
    }
};

seedAuditLogs();
