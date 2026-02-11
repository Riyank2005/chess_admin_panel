import express from 'express';
import { getGames, createGame, updateGameStatus, deleteGame, forceGameEnd, analyzeGameMove, bulkGameOperations } from '../controllers/gameController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, admin, getGames)
    .post(protect, admin, createGame);

router.route('/bulk')
    .post(protect, admin, bulkGameOperations);

router.route('/:id')
    .patch(protect, admin, updateGameStatus)
    .delete(protect, admin, deleteGame);

router.route('/:id/end')
    .post(protect, admin, forceGameEnd);

router.route('/:id/analyze')
    .post(protect, admin, analyzeGameMove);

export default router;
