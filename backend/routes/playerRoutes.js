import express from 'express';
import { getProfile, updateProfile, getRatingHistory, changePassword, getAnalytics } from '../controllers/playerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes for player profile
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile); // Update own profile
router.put('/change-password', protect, changePassword); // Change password
router.get('/rating-history', protect, getRatingHistory); // Get own rating history
router.get('/analytics', protect, getAnalytics); // Get detailed analytics

export default router;
