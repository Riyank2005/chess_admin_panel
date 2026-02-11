import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getUsersForManagement,
    banUser,
    unbanUser,
    suspendUser,
    warnUser,
    getUserDetails
} from '../controllers/userManagementController.js';

const router = express.Router();

router.get('/', protect, admin, getUsersForManagement);
router.get('/:userId', protect, admin, getUserDetails);
router.post('/ban', protect, admin, banUser);
router.post('/unban', protect, admin, unbanUser);
router.post('/suspend', protect, admin, suspendUser);
router.post('/warn', protect, admin, warnUser);

export default router;
