import Tournament from '../models/Tournament.js';
import Player from '../models/Player.js';
import { createAuditEntry } from '../utils/auditLogger.js';

// @desc    Get all tournaments
// @route   GET /api/tournaments
// @access  Private/Admin
export const getTournaments = async (req, res) => {
    try {
        const isAdmin = req.user && req.user.clearanceLevel;
        const query = isAdmin ? {} : { status: { $ne: 'draft' } };
        const tournaments = await Tournament.find(query).sort({ createdAt: -1 });
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
        const { name, timeControl, maxPlayers, prize, startTime, registrationEndDate, totalRounds } = req.body;

        const tournament = await Tournament.create({
            name,
            timeControl,
            maxPlayers,
            prize: prize.startsWith('$') ? prize : `$${prize}`,
            startTime: startTime || new Date(),
            registrationEndDate: registrationEndDate || new Date(Date.now() + 86400000), // Default to 24 hours from now
            totalRounds: totalRounds || 5,
            createdBy: req.user?._id
        });

        await createAuditEntry(req, 'TOURNAMENT_CREATE', 'SYSTEM', `Created tournament: ${name}`);

        res.status(201).json(tournament);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update tournament details
// @route   PUT /api/tournaments/:id
// @access  Private/Admin
export const updateTournament = async (req, res) => {
    try {
        const { name, timeControl, maxPlayers, prize, startTime, registrationEndDate } = req.body;
        const tournament = await Tournament.findById(req.params.id);

        if (tournament) {
            tournament.name = name || tournament.name;
            tournament.timeControl = timeControl || tournament.timeControl;
            tournament.maxPlayers = maxPlayers || tournament.maxPlayers;

            if (prize && !prize.startsWith('$') && !tournament.prize.startsWith('$')) {
                tournament.prize = `$${prize}`;
            } else if (prize) {
                tournament.prize = prize;
            }

            tournament.startTime = startTime || tournament.startTime;
            tournament.registrationEndDate = registrationEndDate || tournament.registrationEndDate;

            const updatedTournament = await tournament.save();
            await createAuditEntry(req, 'TOURNAMENT_UPDATE', 'SYSTEM', `Updated tournament details: ${updatedTournament.name}`);
            res.json(updatedTournament);
        } else {
            res.status(404).json({ message: 'Tournament not found' });
        }
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

// @desc    Register a player for a tournament
// @route   POST /api/tournaments/:id/register
// @access  Private
export const registerPlayer = async (req, res) => {
    try {
        let { playerId } = req.body;

        // Allow self-registration if no ID provided
        if (!playerId && req.user) {
            // Handle DEBUG_ADMIN in development: Use first available player
            if (req.user._id === '000000000000000000000000' && (!process.env.NODE_ENV || process.env.NODE_ENV === 'development')) {
                const randomPlayer = await Player.findOne();
                if (randomPlayer) {
                    playerId = randomPlayer._id;
                    console.log(`[TOURNAMENT] DEBUG: Using player ${randomPlayer.username} for registration testing`);
                } else {
                    return res.status(400).json({ message: 'Debug: Create a player account first to test registration' });
                }
            }
            // Prevent real admins from registering as players
            else if (req.user.role === 'admin' || req.user.clearanceLevel) {
                return res.status(400).json({ message: 'Administrators cannot register for tournaments directly.' });
            }
            // Standard player self-registration
            else {
                playerId = req.user._id;
            }
        }

        const tournament = await Tournament.findById(req.params.id);
        const player = await Player.findById(playerId);

        console.log(`[TOURNAMENT] Registration attempt: Player ${playerId} for Tournament ${req.params.id}`);

        if (!tournament) {
            console.warn(`[TOURNAMENT] Registration failed: Tournament ${req.params.id} not found`);
            return res.status(404).json({ message: 'Tournament not found' });
        }
        if (!player) {
            console.warn(`[TOURNAMENT] Registration failed: Player ${playerId} not found`);
            return res.status(404).json({ message: 'Player not found' });
        }

        // Check if registration is still open
        if (new Date() > tournament.registrationEndDate) {
            console.warn(`[TOURNAMENT] Registration failed: Deadline passed for ${tournament.name}`);
            return res.status(400).json({ message: 'Registration has closed' });
        }

        // Check if tournament is full
        if (tournament.enrolledPlayers.length >= tournament.maxPlayers) {
            console.warn(`[TOURNAMENT] Registration failed: Tournament ${tournament.name} is full`);
            return res.status(400).json({ message: 'Tournament is full' });
        }

        // Check if already registered
        const playerSearchId = playerId.toString();
        const isAlreadyRegistered = tournament.enrolledPlayers.some(
            (p) => p.player && p.player.toString() === playerSearchId
        );
        if (isAlreadyRegistered) {
            console.warn(`[TOURNAMENT] Registration failed: Player ${player.username} already registered for ${tournament.name}`);
            return res.status(400).json({ message: 'Player already registered' });
        }

        tournament.enrolledPlayers.push({
            player: playerId,
            username: player.username,
            elo: player.elo
        });
        tournament.players = tournament.enrolledPlayers.length;

        const updatedTournament = await tournament.save();

        await createAuditEntry(req, 'TOURNAMENT_REGISTER', 'SYSTEM', `Registered player ${player.username} for tournament ${tournament.name}`);

        console.log(`[TOURNAMENT] Registration success: Player ${player.username} enrolled in ${tournament.name}`);
        res.json(updatedTournament);
    } catch (error) {
        console.error('[TOURNAMENT] Registration error:', error);
        res.status(400).json({
            message: error.message,
            error: error.message
        });
    }
};

// @desc    Unregister/Kick a player from a tournament
// @route   DELETE /api/tournaments/:id/register/:playerId
// @access  Private/Admin
export const unregisterPlayer = async (req, res) => {
    try {
        const { id, playerId } = req.params;
        const tournament = await Tournament.findById(id);

        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }

        const initialLength = tournament.enrolledPlayers.length;
        tournament.enrolledPlayers = tournament.enrolledPlayers.filter(
            (p) => p.player.toString() !== playerId
        );

        if (tournament.enrolledPlayers.length === initialLength) {
            return res.status(404).json({ message: 'Player not found in this tournament' });
        }

        tournament.players = tournament.enrolledPlayers.length;
        const updatedTournament = await tournament.save();

        await createAuditEntry(req, 'TOURNAMENT_UNREGISTER', 'SYSTEM', `Removed player ${playerId} from tournament ${tournament.name}`);

        res.json(updatedTournament);
    } catch (error) {
        console.error('[TOURNAMENT] Unregistration error:', error);
        res.status(400).json({ message: error.message });
    }
};
