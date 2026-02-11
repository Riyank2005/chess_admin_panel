import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Player from '../models/Player.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Try to find in Admin domain first
            let user = await Admin.findById(decoded.id).select('-password');

            // If not an admin, check Player domain
            if (!user) {
                user = await Player.findById(decoded.id).select('-password');
            }

            req.user = user;
            if (!user) {
                return res.status(401).json({ message: 'Not authorized, token failed' });
            }
            return next();
        } catch (error) {
            console.error('[AUTH] Token verification failed:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // If no token, allow in development but mark as SYSTEM/DEBUG_ADMIN
    // In production, user would be rejected here
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        console.log('[AUTH] No token provided - allowing as DEBUG_ADMIN for development');
        req.user = {
            _id: '000000000000000000000000', // Dummy ID to prevent CastError
            username: 'DEBUG_ADMIN',
            role: 'admin',
            clearanceLevel: 'SUPER_ADMIN'
        };
        return next();
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const admin = (req, res, next) => {
    // If user exists and either has role 'admin' or belongs to Admin collection
    if (req.user && (req.user.role === 'admin' || req.user.clearanceLevel)) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized: High Clearance Required' });
    }
};

// Role-based permission middleware
export const requirePermission = (requiredLevel) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const userLevel = req.user.clearanceLevel || 'MODERATOR';
        const levels = { 'SUPPORT': 1, 'MODERATOR': 2, 'SUPER_ADMIN': 3 };

        if (levels[userLevel] >= levels[requiredLevel]) {
            next();
        } else {
            res.status(403).json({ message: `Insufficient clearance. Required: ${requiredLevel}` });
        }
    };
};

// Check if user has specific permission
export const hasPermission = (user, permission) => {
    if (!user || !user.clearanceLevel) return false;

    const permissions = {
        'SUPER_ADMIN': ['all'],
        'MODERATOR': ['view', 'edit', 'ban', 'delete_user', 'manage_games'],
        'SUPPORT': ['view', 'edit']
    };

    const userPerms = permissions[user.clearanceLevel] || [];
    return userPerms.includes('all') || userPerms.includes(permission);
};
