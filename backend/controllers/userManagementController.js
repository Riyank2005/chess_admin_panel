import UserManagement from '../models/UserManagement.js';
import Player from '../models/Player.js';
import { createAuditEntry } from '../utils/auditLogger.js';

export const getUsersForManagement = async (req, res) => {
    try {
        const { status, page = 1, limit = 50, search } = req.query;
        const query = {};
        
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            Player.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('username email phone elo games wins losses status isShadowBanned fairPlayRiskScore city country'),
            Player.countDocuments(query)
        ]);

        res.json({
            users: users.map(user => ({
                _id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                elo: user.elo,
                games: user.games,
                wins: user.wins,
                losses: user.losses,
                status: user.status,
                isShadowBanned: user.isShadowBanned,
                fairPlayRiskScore: user.fairPlayRiskScore,
                city: user.city,
                country: user.country
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: error.message });
    }
};

export const banUser = async (req, res) => {
    try {
        const { userId, reason, days = 30 } = req.body;
        const banExpires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        const user = await UserManagement.findOneAndUpdate(
            { playerId: userId },
            {
                status: 'BANNED',
                reason,
                banExpires,
                lastModifiedBy: req.user._id
            },
            { upsert: true, new: true }
        );

        await createAuditEntry(req, 'BAN', userId, `User banned for: ${reason}`);
        res.json({ message: 'User banned successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const unbanUser = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await UserManagement.findOneAndUpdate(
            { playerId: userId },
            { status: 'ACTIVE', banExpires: null, lastModifiedBy: req.user._id },
            { new: true }
        );

        await createAuditEntry(req, 'UNBAN', userId, 'User unbanned');
        res.json({ message: 'User unbanned', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const suspendUser = async (req, res) => {
    try {
        const { userId, reason, days = 7 } = req.body;
        const banExpires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        const user = await UserManagement.findOneAndUpdate(
            { playerId: userId },
            { status: 'SUSPENDED', reason, banExpires, lastModifiedBy: req.user._id },
            { upsert: true, new: true }
        );

        await createAuditEntry(req, 'BAN', userId, `User suspended for: ${reason}`);
        res.json({ message: 'User suspended', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const warnUser = async (req, res) => {
    try {
        const { userId, reason } = req.body;

        const user = await UserManagement.findOneAndUpdate(
            { playerId: userId },
            { $inc: { warnings: 1 }, lastModifiedBy: req.user._id },
            { upsert: true, new: true }
        );

        await createAuditEntry(req, 'BAN', userId, `User warned: ${reason}`);
        res.json({ message: 'User warned', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await UserManagement.findOne({ playerId: userId })
            .populate('playerId')
            .populate('lastModifiedBy', 'username');
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
