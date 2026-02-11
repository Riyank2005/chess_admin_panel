import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Debug route to test if data exists (no auth required)
router.get('/debug/count', async (req, res) => {
    try {
        const count = await AuditLog.countDocuments({});
        const logs = await AuditLog.find({}).limit(5);
        res.json({ count, sampleLogs: logs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all audit logs with filtering and pagination
// @route   GET /api/audit
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const {
            action,
            adminName,
            target,
            dateFrom,
            dateTo,
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};

        if (action) {
            query.action = action;
        }

        if (adminName) {
            query.adminName = { $regex: adminName, $options: 'i' };
        }

        if (target) {
            query.target = { $regex: target, $options: 'i' };
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

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('adminId', 'username email'),
            AuditLog.countDocuments(query)
        ]);

        res.json({
            logs,
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
});

// @desc    Export audit logs as CSV
// @route   GET /api/audit/export
// @access  Private/Admin
router.get('/export', protect, admin, async (req, res) => {
    try {
        const { action, adminName, dateFrom, dateTo } = req.query;

        const query = {};
        if (action) query.action = action;
        if (adminName) query.adminName = { $regex: adminName, $options: 'i' };
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo);
        }

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .limit(10000)
            .populate('adminId', 'username email');

        // Convert to CSV
        const csvHeader = 'Timestamp,Admin,Action,Target,Details,IP Address,User Agent\n';
        const csvRows = logs.map(log => {
            const timestamp = new Date(log.createdAt).toISOString();
            const admin = log.adminName || 'System';
            const action = log.action || '';
            const target = log.target || '';
            const details = (log.details || '').replace(/"/g, '""');
            const ip = log.ipAddress || '';
            const ua = (log.userAgent || '').replace(/"/g, '""');
            return `"${timestamp}","${admin}","${action}","${target}","${details}","${ip}","${ua}"`;
        }).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
        res.send(csvHeader + csvRows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
