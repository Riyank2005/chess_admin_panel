import express from 'express';
import {
    getDMHistory,
    getGameChatHistory
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/dms/:otherPlayerId', getDMHistory);
router.get('/game/:gameId', getGameChatHistory);

export default router;
