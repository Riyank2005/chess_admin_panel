import Player from '../models/Player.js';
import { createAuditEntry } from '../utils/auditLogger.js';

// @desc    Get all players with advanced filtering
export const getUsers = async (req, res) => {
    try {
        const {
            search,
            status,
            role,
            minElo,
            maxElo,
            minRiskScore,
            maxRiskScore,
            isShadowBanned,
            isVerified,
            dateFrom,
            dateTo,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 50
        } = req.query;

        // Build query
        const query = {};

        // Search filter
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Status filter
        if (status) {
            query.status = status;
        }

        // ELO range filter
        if (minElo || maxElo) {
            query.elo = {};
            if (minElo) query.elo.$gte = parseInt(minElo);
            if (maxElo) query.elo.$lte = parseInt(maxElo);
        }

        // Risk score filter
        if (minRiskScore || maxRiskScore) {
            query.fairPlayRiskScore = {};
            if (minRiskScore) query.fairPlayRiskScore.$gte = parseInt(minRiskScore);
            if (maxRiskScore) query.fairPlayRiskScore.$lte = parseInt(maxRiskScore);
        }

        // Boolean filters
        if (isShadowBanned !== undefined) {
            query.isShadowBanned = isShadowBanned === 'true';
        }
        if (isVerified !== undefined) {
            query.isVerified = isVerified === 'true';
        }

        // Date range filter
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo);
        }

        // Sort
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            Player.find(query)
                .select('-password')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Player.countDocuments(query)
        ]);

        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user status (ban/unban/shadow-ban/risk)
export const updateUserStatus = async (req, res) => {
    try {
        const user = await Player.findById(req.params.id);

        if (user) {
            const oldStatus = user.status;
            const oldShadow = user.isShadowBanned;

            if (req.body.status) user.status = req.body.status;
            if (req.body.isShadowBanned !== undefined) user.isShadowBanned = req.body.isShadowBanned;
            if (req.body.fairPlayRiskScore !== undefined) user.fairPlayRiskScore = req.body.fairPlayRiskScore;

            const updatedUser = await user.save();

            // Detailed Audit Log
            let actionType = 'STATUS_UPDATE';
            if (req.body.status === 'banned') actionType = 'BAN';
            if (req.body.isShadowBanned === true) actionType = 'SHADOW_BAN';

            await createAuditEntry(req, actionType, user.username, `Risk: ${user.fairPlayRiskScore}%, shadow: ${user.isShadowBanned}`);

            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete user
export const deleteUser = async (req, res) => {
    try {
        const user = await Player.findById(req.params.id);

        if (user) {
            const username = user.username;
            await user.deleteOne();

            // Audit Log
            await createAuditEntry(req, 'DELETE_USER', username, 'Permanent record termination');

            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk operations on users
export const bulkUserOperations = async (req, res) => {
    try {
        const { userIds, operation, data } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'User IDs array required' });
        }

        if (!operation) {
            return res.status(400).json({ message: 'Operation required' });
        }

        let result;
        let actionType;

        switch (operation) {
            case 'ban':
                result = await Player.updateMany(
                    { _id: { $in: userIds } },
                    { $set: { status: 'banned' } }
                );
                actionType = 'BAN';
                break;

            case 'unban':
                result = await Player.updateMany(
                    { _id: { $in: userIds } },
                    { $set: { status: 'active' } }
                );
                actionType = 'UNBAN';
                break;

            case 'shadowBan':
                result = await Player.updateMany(
                    { _id: { $in: userIds } },
                    { $set: { isShadowBanned: true } }
                );
                actionType = 'SHADOW_BAN';
                break;

            case 'removeShadowBan':
                result = await Player.updateMany(
                    { _id: { $in: userIds } },
                    { $set: { isShadowBanned: false } }
                );
                actionType = 'UNBAN';
                break;

            case 'verify':
                result = await Player.updateMany(
                    { _id: { $in: userIds } },
                    { $set: { isVerified: true } }
                );
                actionType = 'SETTINGS_UPDATE';
                break;

            case 'delete':
                result = await Player.deleteMany({ _id: { $in: userIds } });
                actionType = 'DELETE_USER';
                break;

            default:
                return res.status(400).json({ message: 'Invalid operation' });
        }

        // Audit Log
        await createAuditEntry(
            req,
            actionType,
            `Bulk operation: ${userIds.length} users`,
            `Operation: ${operation}`
        );

        res.json({
            message: `Bulk ${operation} completed`,
            affected: result.modifiedCount || result.deletedCount || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Export users as CSV
export const exportUsers = async (req, res) => {
    try {
        const users = await Player.find().select('-password');

        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No users found to export' });
        }

        // Define CSV headers
        const headers = [
            'ID', 'Username', 'Email', 'Phone', 'Status', 'ELO', 'Games', 
            'Wins', 'Losses', 'Draws', 'Risk Score', 'Shadow Banned', 'Verified', 
            'City', 'Country', 'Created At'
        ];

        // Convert users to CSV rows
        const rows = users.map(user => [
            user._id.toString(),
            user.username || '',
            user.email || '',
            user.phone || '',
            user.status || 'active',
            user.elo || 0,
            user.games || 0,
            user.wins || 0,
            user.losses || 0,
            user.draws || 0,
            user.fairPlayRiskScore || 0,
            user.isShadowBanned ? 'Yes' : 'No',
            user.isVerified ? 'Yes' : 'No',
            user.city || '',
            user.country || '',
            user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : ''
        ]);

        // Escape CSV values
        const escapeCsvValue = (value) => {
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        // Build CSV content
        let csvContent = headers.map(escapeCsvValue).join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.map(escapeCsvValue).join(',') + '\n';
        });

        // Send as CSV file
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);

        // Audit Log
        await createAuditEntry(req, 'EXPORT', 'USERS', `Exported ${users.length} users to CSV`);
    } catch (error) {
        console.error('[EXPORT] Error exporting users:', error);
        res.status(500).json({ message: error.message });
    }
};
