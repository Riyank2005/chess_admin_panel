import ApiKey from '../models/ApiKey.js';
import crypto from 'crypto';

export const getApiKeys = async (req, res) => {
    try {
        const keys = await ApiKey.find({ adminId: req.user._id }).select('-secret');
        res.json(keys);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createApiKey = async (req, res) => {
    try {
        const { name, permissions = [], expiresAt } = req.body;
        
        const key = 'sk_' + crypto.randomBytes(16).toString('hex');
        const secret = crypto.randomBytes(32).toString('hex');

        const apiKey = await ApiKey.create({
            adminId: req.user._id,
            name,
            key,
            secret,
            permissions,
            expiresAt
        });

        res.json({ message: 'API Key created', apiKey: { ...apiKey.toObject(), secret } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const revokeApiKey = async (req, res) => {
    try {
        const { keyId } = req.body;
        await ApiKey.findByIdAndUpdate(keyId, { active: false });
        res.json({ message: 'API Key revoked' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
