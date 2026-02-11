import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getApiKeys,
    createApiKey,
    revokeApiKey
} from '../controllers/apiKeyController.js';

const router = express.Router();

router.get('/', protect, admin, getApiKeys);
router.post('/', protect, admin, createApiKey);
router.post('/revoke', protect, admin, revokeApiKey);

export default router;
