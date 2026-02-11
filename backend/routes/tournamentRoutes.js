import express from 'express';
import {
    getTournaments,
    createTournament,
    updateTournamentStatus,
    deleteTournament
} from '../controllers/tournamentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, admin, getTournaments)
    .post(protect, admin, createTournament);

router.route('/:id')
    .delete(protect, admin, deleteTournament);

router.route('/:id/status')
    .patch(protect, admin, updateTournamentStatus);

export default router;
