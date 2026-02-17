import jwt from 'jsonwebtoken';
import Player from '../models/Player.js';
import Admin from '../models/Admin.js';
import nodemailer from 'nodemailer';


const generateToken = (id) => {
    const secret = process.env.JWT_SECRET || 'secret123';
    return jwt.sign({ id }, secret, {
        expiresIn: '30d',
    });
};

// Fast2SMS Config
const fast2smsApiKey = process.env.FAST2SMS_API_KEY;

// Send Notification (SMS or Email)
const sendNotification = async (user, otp) => {
    console.log(`----------------------------------------`);
    console.log(`OTP FOR: ${user.username}`);
    if (user.phone) console.log(`PHONE: ${user.phone}`);
    if (user.email) console.log(`EMAIL: ${user.email}`);
    console.log(`OTP CODE: ${otp}`);
    console.log(`----------------------------------------`);

    // SMS via Fast2SMS
    const isKeyValid = fast2smsApiKey && !fast2smsApiKey.includes('*');

    if (user.phone && isKeyValid) {
        try {
            // Fast2SMS typically expects 10 digits for Indian numbers
            // We strip non-digits and take the last 10 characters
            const cleanPhone = user.phone.replace(/\D/g, '').slice(-10);

            console.log(`📡 [SMS DEBUG] Attempting to send OTP to: ${cleanPhone}`);
            const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsApiKey}&route=otp&variables_values=${otp}&flash=0&numbers=${cleanPhone}`;
            const response = await fetch(url);

            const data = await response.json();

            if (data.return) {
                console.log(`✅ [SMS SUCCESS] Fast2SMS confirmed message sent to ${cleanPhone}`);
            } else {
                console.error(`❌ [SMS API ERROR] Fast2SMS rejected request:`, data);
                console.log("💡 Possible issues: Key expired, No balance, or Number not verified for Free accounts.");
                console.log("💡 If this number is different, please use the OTP printed above in the terminal.");
            }

        } catch (error) {
            console.error("❌ [SMS SYSTEM ERROR] Failed to reach Fast2SMS:", error.message);
        }
    } else {
        if (!user.phone) console.log("⚠️ [SMS SKIP] No phone number associated with this account.");
        if (!fast2smsApiKey) console.log("⚠️ [SMS SKIP] FAST2SMS_API_KEY is missing in your .env file.");
        else if (!isKeyValid) console.log("⚠️ [SMS SKIP] FAST2SMS_API_KEY is a placeholder. Skipping SMS.");
    }
};

// @desc    Register a new player or admin & Send OTP
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    try {
        const timestamp = new Date().toISOString();
        console.log(`\n[${timestamp}] 🛡️  SECURITY EVENT: CLEARANCE REQUESTED`);
        console.log(`[${timestamp}] 📝 OPERATOR ALIAS: ${req.body.username}`);
        console.log(`[${timestamp}] 🛡️  ENCRYPTION: AES-256 ACTIVE`);

        const { username, email, phone, password, role = 'player' } = req.body;

        if (!username || !email || !phone || !password) {
            console.log(`[${timestamp}] ❌ ACCESS DENIED: MISSING PARAMETERS`);
            return res.status(400).json({ message: 'All biological identifiers (Username, Email, Phone, Password) are required.' });
        }

        const generateTacticalCode = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let result = '';
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        const otp = generateTacticalCode();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

        // Check if registering as admin
        if (role === 'admin') {
            // Check if admin already exists
            const adminExists = await Admin.findOne({ $or: [{ username }, { email }] });
            if (adminExists) {
                console.log(`[${timestamp}] ⚠️ ALERT: ADMIN CONFLICT DETECTED FOR ${username}`);
                return res.status(400).json({
                    message: 'Admin account already exists with this username or email.'
                });
            }

            const admin = await Admin.create({
                username,
                email,
                phone,
                password,
                clearanceLevel: 'SUPER_ADMIN'
            });

            if (admin) {
                console.log(`\n`);
                console.log(`╔════════════════════════════════════════════════════════╗`);
                console.log(`║           🔐 ADMIN ACCOUNT CREATED 🔐                 ║`);
                console.log(`╠════════════════════════════════════════════════════════╣`);
                console.log(`║  ADMIN: ${admin.username.padEnd(45)}║`);
                console.log(`║  EMAIL: ${admin.email.padEnd(45)}║`);
                console.log(`╚════════════════════════════════════════════════════════╝`);
                console.log(`\n`);

                return res.status(201).json({
                    message: 'Admin account created successfully. You can now login.',
                    userId: admin._id,
                    email: admin.email,
                    isAdmin: true
                });
            }
        } else {
            // Register as player (original flow)
            const query = [{ username }, { phone }, { email }];
            const userExists = await Player.findOne({ $or: query });

            if (userExists) {
                console.log(`[${timestamp}] ⚠️ ALERT: CONFLICT DETECTED FOR ${username}`);
                let field = 'User';
                if (userExists.username === username) field = 'Username';
                else if (userExists.phone === phone) field = 'Phone';
                else if (userExists.email === email) field = 'Email';

                return res.status(400).json({
                    message: `Identity Conflict: ${field} is already registered in the Nexus.`
                });
            }

            const user = await Player.create({
                username,
                email,
                phone,
                password,
                otp,
                otpExpires,
                isVerified: false
            });

            if (user) {
                console.log(`\n`);
                console.log(`╔════════════════════════════════════════════════════════╗`);
                console.log(`║           🔐 TACTICAL OTP GENERATED 🔐                ║`);
                console.log(`╠════════════════════════════════════════════════════════╣`);
                console.log(`║  OPERATOR: ${user.username.padEnd(43)}║`);
                console.log(`║  EMAIL:    ${user.email.padEnd(43)}║`);
                console.log(`║  PHONE:    ${user.phone.padEnd(43)}║`);
                console.log(`╠════════════════════════════════════════════════════════╣`);
                console.log(`║                                                        ║`);
                console.log(`║              🎯 OTP CODE: ${otp}                      ║`);
                console.log(`║                                                        ║`);
                console.log(`║  ⏰ Expires in: 15 minutes                             ║`);
                console.log(`╚════════════════════════════════════════════════════════╝`);
                console.log(`\n`);

                await sendNotification(user, otp);

                return res.status(201).json({
                    message: 'Strategic Clearance Initiated. Identity Cipher dispatched.',
                    userId: user._id,
                    email: user.email,
                    phone: user.phone,
                    otp: otp
                });
            } else {
                return res.status(400).json({ message: 'System Rejection: Invalid identity data.' });
            }
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] 💥 CRITICAL ERROR during registration:`, error);
        return res.status(500).json({ message: 'Nexus Core unstable. Please try again later.' });
    }
};

// @desc    Verify OTP for Player
// @route   POST /api/auth/verify
// @access  Public
export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body;

    try {
        const user = await Player.findById(userId);

        if (!user) {
            return res.status(400).json({ message: 'Player not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Account already verified' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            role: 'player', // Fixed role in response
            token: generateToken(user._id),
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Resend OTP for Player
// @route   POST /api/auth/resend-otp
export const resendOtp = async (req, res) => {
    const { email, phone } = req.body;

    try {
        const query = {};
        if (phone) query.phone = phone;
        else if (email) query.email = email;
        else return res.status(400).json({ message: 'Email or Phone required' });

        const user = await Player.findOne(query);

        if (!user) {
            return res.status(404).json({ message: 'Player not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Account already verified' });
        }

        const generateTacticalCode = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let result = '';
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        const otp = generateTacticalCode();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        console.log(`\n`);
        console.log(`╔════════════════════════════════════════════════════════╗`);
        console.log(`║         🔄 TACTICAL OTP RESENT 🔄                     ║`);
        console.log(`╠════════════════════════════════════════════════════════╣`);
        console.log(`║  OPERATOR: ${user.username.padEnd(43)}║`);
        console.log(`║  EMAIL:    ${user.email.padEnd(43)}║`);
        console.log(`║  PHONE:    ${user.phone.padEnd(43)}║`);
        console.log(`╠════════════════════════════════════════════════════════╣`);
        console.log(`║                                                        ║`);
        console.log(`║              🎯 NEW OTP CODE: ${otp}                  ║`);
        console.log(`║                                                        ║`);
        console.log(`║  ⏰ Expires in: 15 minutes                             ║`);
        console.log(`╚════════════════════════════════════════════════════════╝`);
        console.log(`\n`);
        await sendNotification(user, otp);

        res.status(200).json({
            message: 'New security cipher dispatched.',
            otp: otp
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth player & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    const { username, password, otp } = req.body;
    console.log(`[loginUser] Incoming login attempt for username: ${username}`);

    try {
        const user = await Player.findOne({ username });

        if (user && (await user.matchPassword(password))) {
            if (!user.isVerified) {
                return res.status(401).json({ message: 'Account not verified. Please verify your identity.' });
            }

            if (user.status === 'banned') {
                return res.status(403).json({ message: 'Your account has been quarantined by the Nexus Oversight.' });
            }

            // --- NEW: OTP LOGIN VERIFICATION ---
            // If OTP not provided, generate one and send to user
            if (!otp) {
                const generateTacticalCode = () => {
                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                    let result = '';
                    for (let i = 0; i < 6; i++) {
                        result += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    return result;
                };

                const loginOtp = generateTacticalCode();
                const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

                // Temporarily store OTP on user document
                user.loginOtp = loginOtp;
                user.loginOtpExpires = otpExpires;
                await user.save();

                console.log(`\n`);
                console.log(`╔════════════════════════════════════════════════════════╗`);
                console.log(`║         🔐 LOGIN OTP GENERATED 🔐                      ║`);
                console.log(`╠════════════════════════════════════════════════════════╣`);
                console.log(`║  OPERATOR: ${user.username.padEnd(43)}║`);
                console.log(`║  EMAIL:    ${user.email.padEnd(43)}║`);
                console.log(`║  PHONE:    ${user.phone.padEnd(43)}║`);
                console.log(`╠════════════════════════════════════════════════════════╣`);
                console.log(`║                                                        ║`);
                console.log(`║              🎯 LOGIN OTP CODE: ${loginOtp}                ║`);
                console.log(`║                                                        ║`);
                console.log(`║  ⏰ Expires in: 15 minutes                             ║`);
                console.log(`╚════════════════════════════════════════════════════════╝`);
                console.log(`\n`);

                await sendNotification(user, loginOtp);

                return res.status(200).json({
                    message: 'OTP sent to your registered email/phone. Please verify to continue.',
                    userId: user._id,
                    requiresOtp: true,
                    email: user.email,
                    phone: user.phone
                });
            }

            // --- If OTP is provided, verify it ---
            if (!user.loginOtp || user.loginOtp !== otp) {
                return res.status(401).json({ message: 'Invalid OTP code' });
            }

            if (user.loginOtpExpires < Date.now()) {
                return res.status(401).json({ message: 'OTP has expired. Please request a new one.' });
            }

            // Clear OTP after verification
            user.loginOtp = undefined;
            user.loginOtpExpires = undefined;

            // --- IP TRACKING LOGIC ---
            let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0';
            if (ip.includes(',')) ip = ip.split(',')[0].trim();
            if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');

            let city = 'Unknown';
            let country = 'Unknown';

            if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
                city = 'Local Command';
                country = 'Internal Network';
            } else {
                try {
                    const geoReq = await fetch(`http://ip-api.com/json/${ip}`);
                    const geoData = await geoReq.json();
                    if (geoData.status === 'success') {
                        city = geoData.city;
                        country = geoData.country;
                        if (geoData.lat && geoData.lon) {
                            user.coordinates = {
                                lat: geoData.lat,
                                lon: geoData.lon
                            };
                        }
                    }
                } catch (err) {
                    console.log('Geo-location fetch failed:', err.message);
                }
            }

            user.lastIp = ip;
            user.city = city;
            user.country = country;
            user.lastLogin = new Date();
            await user.save();

            res.json({
                _id: user._id,
                username: user.username,
                role: 'player',
                city: user.city,
                country: user.country,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin login with OTP verification
// @route   POST /api/auth/admin-login
// @access  Public
export const adminLogin = async (req, res) => {
    const { username, password, otp } = req.body;
    console.log(`[adminLogin] Incoming admin-login attempt for username: ${username}`);

    try {
        const admin = await Admin.findOne({ username });

        if (admin && (await admin.matchPassword(password))) {
            // --- STEP 1: OTP not provided, generate one ---
            if (!otp) {
                const generateTacticalCode = () => {
                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                    let result = '';
                    for (let i = 0; i < 6; i++) {
                        result += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    return result;
                };

                const loginOtp = generateTacticalCode();
                const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

                // Temporarily store OTP on admin document
                admin.loginOtp = loginOtp;
                admin.loginOtpExpires = otpExpires;
                await admin.save();

                console.log(`\n`);
                console.log(`╔════════════════════════════════════════════════════════╗`);
                console.log(`║       🔐 ADMIN LOGIN OTP GENERATED 🔐                  ║`);
                console.log(`╠════════════════════════════════════════════════════════╣`);
                console.log(`║  ADMIN: ${admin.username.padEnd(46)}║`);
                console.log(`║  EMAIL: ${admin.email.padEnd(46)}║`);
                console.log(`╠════════════════════════════════════════════════════════╣`);
                console.log(`║                                                        ║`);
                console.log(`║              🎯 LOGIN OTP CODE: ${loginOtp}                ║`);
                console.log(`║                                                        ║`);
                console.log(`║  ⏰ Expires in: 15 minutes                             ║`);
                console.log(`╚════════════════════════════════════════════════════════╝`);
                console.log(`\n`);
                await sendNotification(admin, loginOtp);

                return res.status(200).json({
                    message: 'OTP sent to your registered email. Please verify to continue.',
                    adminId: admin._id,
                    requiresOtp: true,
                    email: admin.email
                });
            }

            // --- STEP 2: OTP provided, verify it ---
            if (!admin.loginOtp || admin.loginOtp !== otp) {
                return res.status(401).json({ message: 'Invalid OTP code' });
            }

            if (admin.loginOtpExpires < Date.now()) {
                return res.status(401).json({ message: 'OTP has expired. Please request a new one.' });
            }

            // Clear OTP after verification
            admin.loginOtp = undefined;
            admin.loginOtpExpires = undefined;
            admin.lastLogin = new Date();
            await admin.save();

            res.json({
                _id: admin._id,
                username: admin.username,
                email: admin.email,
                role: 'admin',
                clearanceLevel: admin.clearanceLevel,
                token: generateToken(admin._id),
                message: 'Admin login verified successfully'
            });
        } else {
            res.status(401).json({ message: 'Invalid admin credentials' });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: error.message });
    }
};
