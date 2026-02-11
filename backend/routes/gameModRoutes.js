import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getGameModerations,
    flagGame,
    reviewGame,
    terminateGame,
    bulkTerminateGames,
    bulkBanPlayers
} from '../controllers/gameModController.js';

const router = express.Router();

router.get('/', protect, admin, getGameModerations);
router.post('/flag', protect, admin, flagGame);
router.post('/review', protect, admin, reviewGame);
router.post('/terminate', protect, admin, terminateGame);
router.post('/bulk-terminate', protect, admin, bulkTerminateGames);
router.post('/bulk-ban', protect, admin, bulkBanPlayers);

export default router;
