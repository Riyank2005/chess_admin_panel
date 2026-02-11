import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    get2faStatus,
    enable2fa,
    verify2fa,
    disable2fa
} from '../controllers/admin2faController.js';

const router = express.Router();

router.get('/status', protect, admin, get2faStatus);
router.post('/enable', protect, admin, enable2fa);
router.post('/verify', protect, admin, verify2fa);
router.post('/disable', protect, admin, disable2fa);

export default router;
