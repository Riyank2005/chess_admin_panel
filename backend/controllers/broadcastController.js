import Broadcast from '../models/Broadcast.js';
import SystemSetting from '../models/SystemSetting.js';
import { createAuditEntry } from '../utils/auditLogger.js';

// @desc    Get the latest active broadcast
// @route   GET /api/system/broadcast/active
export const getActiveBroadcast = async (req, res) => {
    try {
        const broadcast = await Broadcast.findOne({ isActive: true })
            .sort({ createdAt: -1 });
        res.json(broadcast);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new global broadcast
// @route   POST /api/system/broadcast
export const createBroadcast = async (req, res) => {
    try {
        const { message, type, durationMinutes } = req.body;

        // 1. Deactivate older broadcasts
        await Broadcast.updateMany({ isActive: true }, { isActive: false });

        // 2. Create New Broadcast
        const expiresAt = durationMinutes ? new Date(Date.now() + durationMinutes * 60000) : null;

        const broadcast = await Broadcast.create({
            message,
            type,
            expiresAt,
            sender: req.user?.username || 'SuperAdmin',
            isActive: true
        });

        // 3. Sync to SystemSettings for universal access
        await SystemSetting.findOneAndUpdate(
            { key: 'global_broadcast' },
            { value: message, lastUpdatedBy: req.user?._id },
            { upsert: true }
        );

        // 4. Trace in Audit
        await createAuditEntry(req, 'BROADCAST', 'GLOBAL', `Insignia Dispatch: ${message}`);

        res.status(201).json(broadcast);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Deactivate all broadcasts
// @route   POST /api/system/broadcast/shutdown
export const shutdownBroadcast = async (req, res) => {
    try {
        await Broadcast.updateMany({ isActive: true }, { isActive: false });
        await SystemSetting.findOneAndUpdate({ key: 'global_broadcast' }, { value: '' });

        await createAuditEntry(req, 'BROADCAST', 'SHUTDOWN', 'Global transmission terminated');

        res.json({ message: 'Broadcast channel closed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
