import AuditLog from '../models/AuditLog.js';

export const createAuditEntry = async (req, action, target, details = '') => {
    try {
        await AuditLog.create({
            adminId: req.user?._id || '000000000000000000000000', // Default if no user (initial setup)
            adminName: req.user?.username || 'SYSTEM',
            action,
            target,
            details,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || '0.0.0.0',
            userAgent: req.headers['user-agent']
        });
    } catch (error) {
        console.error('CRITICAL: Audit Log Failure:', error);
    }
};
