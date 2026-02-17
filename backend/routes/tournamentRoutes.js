import express from 'express';
import {
    getTournaments,
    createTournament,
    updateTournament,
    updateTournamentStatus,
    deleteTournament,
    registerPlayer,
    unregisterPlayer
} from '../controllers/tournamentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getTournaments)
    .post(protect, admin, createTournament);

router.route('/:id')
    .put(protect, admin, updateTournament)
    .delete(protect, admin, deleteTournament);

router.route('/:id/status')
    .patch(protect, admin, updateTournamentStatus);

router.route('/:id/register')
    .post(protect, registerPlayer);

router.route('/:id/register/:playerId')
    .delete(protect, admin, unregisterPlayer);

export default router;
