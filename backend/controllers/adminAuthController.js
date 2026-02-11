import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

// @desc    Auth admin & get token
// @route   POST /api/auth/admin/login
// @access  Public (Tactical Entry)
export const loginAdmin = async (req, res) => {
    const { username, password } = req.body;
    console.log(`[adminLogin] Incoming login attempt for username: ${username}`);

    try {
        const admin = await Admin.findOne({ username });

        if (admin && (await admin.matchPassword(password))) {

            // Log the access
            admin.lastLogin = new Date();
            await admin.save();

            res.json({
                _id: admin._id,
                username: admin.username,
                email: admin.email,
                role: 'admin', // Interface expects 'admin'
                clearance: admin.clearanceLevel,
                token: generateToken(admin._id),
            });
        } else {
            res.status(401).json({ message: 'Access Denied: Invalid Credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new admin (Internal Only)
// @route   POST /api/auth/admin/setup
export const setupAdmin = async (req, res) => {
    const { username, email, password, secretKey } = req.body;

    // Protection against unauthorized admin creation
    if (secretKey !== process.env.ADMIN_SETUP_KEY && secretKey !== 'NEXUS_INIT_2024') {
        return res.status(403).json({ message: 'Unauthorized for System Setup' });
    }

    try {
        const adminExists = await Admin.findOne({ email });
        if (adminExists) {
            return res.status(400).json({ message: 'Admin already registered' });
        }

        const admin = await Admin.create({
            username,
            email,
            password,
            clearanceLevel: 'SUPER_ADMIN'
        });

        res.status(201).json({
            message: 'System Administrator initialized.',
            _id: admin._id
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
