import express from 'express';
import { registerUser, loginUser, verifyEmail, resendOtp, adminLogin } from '../controllers/authController.js';
import { loginAdmin, setupAdmin } from '../controllers/adminAuthController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify', verifyEmail);
router.post('/resend-otp', resendOtp);

// Admin Login with OTP
router.post('/admin-login', adminLogin);

// Admin Domain Routes
router.post('/admin/login', loginAdmin);
router.post('/admin/setup', setupAdmin);

export default router;
