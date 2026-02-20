import express from 'express';
import { getGames, createGame, updateGameStatus, deleteGame, forceGameEnd, analyzeGameMove, bulkGameOperations, getGameById } from '../controllers/gameController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getGames)
    .post(protect, admin, createGame);

router.route('/bulk')
    .post(protect, admin, bulkGameOperations);

// Use a regex to ensure :id only matches 24-char hex strings (valid Mongo IDs)
// This prevents strings like "moderation" or "bulk" from hitting these routes
router.route('/:id([0-9a-fA-F]{24})')
    .get(protect, getGameById)
    .patch(protect, admin, updateGameStatus)
    .delete(protect, admin, deleteGame);

router.route('/:id([0-9a-fA-F]{24})/end')
    .post(protect, admin, forceGameEnd);

router.route('/:id([0-9a-fA-F]{24})/analyze')
    .post(protect, admin, analyzeGameMove);

export default router;
