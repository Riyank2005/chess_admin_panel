import Tournament from '../models/Tournament.js';
import { createAuditEntry } from '../utils/auditLogger.js';

// @desc    Get all tournaments
// @route   GET /api/tournaments
// @access  Private/Admin
export const getTournaments = async (req, res) => {
    try {
        const tournaments = await Tournament.find({}).sort({ createdAt: -1 });
        res.json(tournaments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new tournament
// @route   POST /api/tournaments
// @access  Private/Admin
export const createTournament = async (req, res) => {
    try {
        const { name, timeControl, maxPlayers, prize, startTime, totalRounds } = req.body;

        const tournament = await Tournament.create({
            name,
            timeControl,
            maxPlayers,
            prize: prize.startsWith('$') ? prize : `$${prize}`,
            startTime: startTime || new Date(),
            totalRounds: totalRounds || 5,
            createdBy: req.user?._id
        });

        await createAuditEntry(req, 'TOURNAMENT_CREATE', 'SYSTEM', `Created tournament: ${name}`);

        res.status(201).json(tournament);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update tournament status
// @route   PATCH /api/tournaments/:id/status
// @access  Private/Admin
export const updateTournamentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const tournament = await Tournament.findById(req.params.id);

        if (tournament) {
            tournament.status = status;
            const updatedTournament = await tournament.save();

            await createAuditEntry(req, 'TOURNAMENT_UPDATE', 'SYSTEM', `Updated status of ${tournament.name} to ${status}`);

            res.json(updatedTournament);
        } else {
            res.status(404).json({ message: 'Tournament not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a tournament
// @route   DELETE /api/tournaments/:id
// @access  Private/Admin
export const deleteTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);

        if (tournament) {
            await Tournament.deleteOne({ _id: req.params.id });

            await createAuditEntry(req, 'TOURNAMENT_DELETE', 'SYSTEM', `Deleted tournament: ${tournament.name}`);

            res.json({ message: 'Tournament removed' });
        } else {
            res.status(404).json({ message: 'Tournament not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
