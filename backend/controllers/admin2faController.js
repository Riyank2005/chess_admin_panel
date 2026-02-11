import { generateSecret, verify, generateURI } from 'otplib';
import QRCode from 'qrcode';
import Admin from '../models/Admin.js';

// @desc    Get 2FA status for current admin
// @route   GET /api/admin/2fa/status
// @access  Private/Admin
export const get2faStatus = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id);
        res.json({ enabled: admin.twoFactorEnabled });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Enable 2FA and generate secret
// @route   POST /api/admin/2fa/enable
// @access  Private/Admin
export const enable2fa = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id);

        // Generate a new secret
        const secret = generateSecret();
        const otpauth = generateURI({
            issuer: 'Nexus Chess Control',
            label: admin.email,
            secret
        });

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(otpauth);

        // Generate backup codes
        const backupCodes = Array.from({ length: 8 }, () =>
            Math.random().toString(36).substring(2, 10).toUpperCase()
        );

        // Store temporary secret and backup codes (don't enable yet)
        admin.twoFactorSecret = secret;
        admin.twoFactorBackupCodes = backupCodes;
        await admin.save();

        res.json({
            secret,
            qrCodeUrl,
            backupCodes
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify and finalize 2FA enabling
// @route   POST /api/admin/2fa/verify
// @access  Private/Admin
export const verify2fa = async (req, res) => {
    const { code } = req.body;

    try {
        const admin = await Admin.findById(req.user._id);

        if (!admin.twoFactorSecret) {
            return res.status(400).json({ message: '2FA setup not initiated' });
        }

        // v13 verify is async
        const isValid = await verify({
            token: code,
            secret: admin.twoFactorSecret
        });

        if (isValid) {
            admin.twoFactorEnabled = true;
            await admin.save();
            res.json({ message: '2FA enabled successfully' });
        } else {
            res.status(400).json({ message: 'Invalid verification code' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Disable 2FA
// @route   POST /api/admin/2fa/disable
// @access  Private/Admin
export const disable2fa = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id);
        admin.twoFactorEnabled = false;
        admin.twoFactorSecret = undefined;
        admin.twoFactorBackupCodes = [];
        await admin.save();
        res.json({ message: '2FA disabled successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
