import Game from '../models/Game.js';
import { createAuditEntry } from '../utils/auditLogger.js';
import analysisService from '../services/analysisService.js';

// @desc    Get all games with advanced filtering
export const getGames = async (req, res) => {
    try {
        const {
            search,
            status,
            white,
            black,
            timeControl,
            dateFrom,
            dateTo,
            minMoves,
            maxMoves,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 50
        } = req.query;

        // Build query
        const query = {};

        // Security: If not admin, restrict to own games
        const isAdmin = req.user && (req.user.role === 'admin' || req.user.clearanceLevel);
        if (!isAdmin) {
            query.$or = [
                { white: req.user._id },
                { black: req.user._id }
            ];
        } else if (req.query.participant) {
            // Admin filtering by participant
            query.$or = [
                { white: req.query.participant },
                { black: req.query.participant }
            ];
        }

        // Search filter
        if (search) {
            query.$or = [
                { white: { $regex: search, $options: 'i' } },
                { black: { $regex: search, $options: 'i' } }
            ];
        }

        // Status filter
        if (status) {
            query.status = status;
        }



        if (white) {
            query.white = white;
        }
        if (black) {
            query.black = black;
        }

        // Time control filter
        if (timeControl) {
            query.timeControl = timeControl;
        }

        // Moves range filter
        if (minMoves || maxMoves) {
            query.moves = {};
            if (minMoves) query.moves.$gte = parseInt(minMoves);
            if (maxMoves) query.moves.$lte = parseInt(maxMoves);
        }

        // Date range filter
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo);
        }

        // Sort
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [games, total] = await Promise.all([
            Game.find(query)
                .populate('white black', 'username elo')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Game.countDocuments(query)
        ]);

        res.json({
            games,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new game
export const createGame = async (req, res) => {
    try {
        const { white, black, whiteElo, blackElo, timeControl } = req.body;

        const game = await Game.create({
            white,
            black,
            whiteElo,
            blackElo,
            timeControl
        });

        res.status(201).json(game);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update game status
export const updateGameStatus = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);

        if (game) {
            game.status = req.body.status || game.status;
            game.moves = req.body.moves || game.moves;
            game.duration = req.body.duration || game.duration;
            game.pgn = req.body.pgn || game.pgn;

            const updatedGame = await game.save();
            res.json(updatedGame);
        } else {
            res.status(404).json({ message: 'Game not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get game by ID
export const getGameById = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id)
            .populate('white', 'username elo')
            .populate('black', 'username elo');

        if (game) {
            // Security check: Players can only view their own games (or public ones if we decide so, but usually safe to restrict)
            const isAdmin = req.user && (req.user.role === 'admin' || req.user.clearanceLevel);
            const isParticipant = game.white._id.equals(req.user._id) || game.black._id.equals(req.user._id);

            if (isAdmin || isParticipant) {
                res.json(game);
            } else {
                res.status(403).json({ message: 'Not authorized to view this game' });
            }
        } else {
            res.status(404).json({ message: 'Game not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a game
export const deleteGame = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);

        if (game) {
            const gameId = game._id;
            await game.deleteOne();

            // Audit Log
            await createAuditEntry(req, 'GAME_TERMINATED', gameId.toString(), 'Match record deleted from database');

            res.json({ message: 'Game removed' });
        } else {
            res.status(404).json({ message: 'Game not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Force game end (Draw/Abort)
export const forceGameEnd = async (req, res) => {
    try {
        const { action } = req.body; // 'draw' or 'abort'
        const game = await Game.findById(req.params.id);

        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }

        if (action === 'draw') {
            game.status = 'drawn';
            game.result = '1/2-1/2';
            game.description = 'Game drawn by Admin decision';
        } else if (action === 'abort') {
            game.status = 'aborted';
            game.result = 'Aborted';
            game.description = 'Game aborted by Admin';
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        const updatedGame = await game.save();

        // Audit Log
        await createAuditEntry(req, 'GAME_TERMINATED', game._id.toString(), `Force action: ${action.toUpperCase()}`);

        res.json(updatedGame);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Analyze a game move using Nexus Bridge
// @route   POST /api/games/:id/analyze
export const analyzeGameMove = async (req, res) => {
    try {
        const { fen, playedMove, timeTaken } = req.body;
        const gameId = req.params.id;

        // 1. Get Engine Evaluation
        const analysis = await analysisService.analyzePosition(fen);

        // 2. Calculate Fair-Play Risk
        const riskScore = analysisService.calculateMoveRisk(playedMove, analysis.bestMove, timeTaken);

        // 3. Log suspicious moves to Audit if Risk > 70%
        if (riskScore > 70) {
            await createAuditEntry(req, 'SHADOW_BAN', `Suspicious Move in Game ${gameId}`, `Engine correlation detected. Risk: ${riskScore}%. Move: ${playedMove}`);
        }

        res.json({
            ...analysis,
            riskScore,
            status: "success"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk operations on games
export const bulkGameOperations = async (req, res) => {
    try {
        const { gameIds, operation, data } = req.body;

        if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
            return res.status(400).json({ message: 'Game IDs array required' });
        }

        if (!operation) {
            return res.status(400).json({ message: 'Operation required' });
        }

        let result;
        let actionType;

        switch (operation) {
            case 'delete':
                result = await Game.deleteMany({ _id: { $in: gameIds } });
                actionType = 'GAME_TERMINATED';
                break;

            case 'abort':
                result = await Game.updateMany(
                    { _id: { $in: gameIds } },
                    {
                        $set: {
                            status: 'aborted',
                            result: 'Aborted',
                            description: 'Bulk aborted by Admin'
                        }
                    }
                );
                actionType = 'GAME_TERMINATED';
                break;

            case 'draw':
                result = await Game.updateMany(
                    { _id: { $in: gameIds } },
                    {
                        $set: {
                            status: 'drawn',
                            result: '1/2-1/2',
                            description: 'Bulk drawn by Admin'
                        }
                    }
                );
                actionType = 'GAME_TERMINATED';
                break;

            default:
                return res.status(400).json({ message: 'Invalid operation' });
        }

        // Audit Log
        await createAuditEntry(
            req,
            actionType,
            `Bulk operation: ${gameIds.length} games`,
            `Operation: ${operation}`
        );

        res.json({
            message: `Bulk ${operation} completed`,
            affected: result.modifiedCount || result.deletedCount || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
