import GameMod from '../models/GameMod.js';
import Game from '../models/Game.js';
import { createAuditEntry } from '../utils/auditLogger.js';

export const getGameModerations = async (req, res) => {
    try {
        console.log('[MODERATION] 🔍 Fetching game moderations:', req.query);
        const { status, severity, page = 1, limit = 50 } = req.query;
        const query = {};

        // Ensure we only query valid status/severity if they aren't 'all'
        if (status && status !== 'all' && status !== 'undefined') query.status = status;
        if (severity && severity !== 'all' && severity !== 'undefined') query.severity = severity;

        console.log('[MODERATION] 🔍 Query:', query);

        const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
        const [mods, total] = await Promise.all([
            GameMod.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(), // Use lean() for better performance and plain objects
            GameMod.countDocuments(query)
        ]);

        res.json({
            mods: (mods || []).map(mod => ({
                _id: mod._id,
                gameId: mod.gameId,
                whitePlayer: mod.whitePlayer || 'Unknown',
                blackPlayer: mod.blackPlayer || 'Unknown',
                reason: mod.reason || 'OTHER',
                severity: mod.severity || 'MEDIUM',
                status: mod.status || 'FLAGGED',
                reportedBy: mod.reportedBy || 'SYSTEM',
                notes: mod.notes || '',
                createdAt: mod.createdAt,
                updatedAt: mod.updatedAt
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)) || 1
            }
        });
    } catch (error) {
        console.error('[MODERATION] ❌ Error fetching game mods:', error);
        res.status(500).json({
            message: 'Failed to retrieve moderation data',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const flagGame = async (req, res) => {
    try {
        const { gameId, reason, severity = 'MEDIUM', notes } = req.body;

        const game = await Game.findById(gameId);
        if (!game) return res.status(404).json({ message: 'Game not found' });

        const mod = await GameMod.create({
            gameId,
            whitePlayer: game.white,
            blackPlayer: game.black,
            reason,
            severity,
            status: 'FLAGGED',
            reportedBy: req.user?.username || 'SYSTEM',
            notes
        });

        await createAuditEntry(req, 'GAME_TERMINATED', gameId, `Game flagged: ${reason}`);
        res.json({ message: 'Game flagged for review', mod });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const reviewGame = async (req, res) => {
    try {
        const { modId, decision, notes } = req.body;

        const mod = await GameMod.findByIdAndUpdate(
            modId,
            {
                status: 'UNDER_REVIEW',
                reviewedBy: req.user._id,
                decision,
                notes
            },
            { new: true }
        );

        await createAuditEntry(req, 'SETTINGS_UPDATE', modId, `Game reviewed: ${decision}`);
        res.json({ message: 'Game review completed', mod });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const terminateGame = async (req, res) => {
    try {
        const { gameId, reason } = req.body;

        const game = await Game.findByIdAndUpdate(gameId, { status: 'terminated' }, { new: true });

        const mod = await GameMod.findOneAndUpdate(
            { gameId },
            { status: 'TERMINATED', reviewedBy: req.user._id },
            { new: true }
        );

        await createAuditEntry(req, 'GAME_TERMINATED', gameId, `Game terminated: ${reason}`);
        res.json({ message: 'Game terminated', game, mod });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const bulkTerminateGames = async (req, res) => {
    try {
        const { gameIds, reason } = req.body;

        const results = await Promise.all([
            Game.updateMany({ _id: { $in: gameIds } }, { status: 'terminated' }),
            GameMod.updateMany(
                { gameId: { $in: gameIds } },
                { status: 'TERMINATED', reviewedBy: req.user._id, decision: reason }
            )
        ]);

        await createAuditEntry(req, 'GAME_TERMINATED', 'MULTIPLE', `Bulk terminate ${gameIds.length} games: ${reason}`);
        res.json({ message: `Successfully terminated ${gameIds.length} games`, results });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const bulkBanPlayers = async (req, res) => {
    try {
        const { gameIds, reason } = req.body;

        // Find all games to get player usernames/IDs
        const games = await Game.find({ _id: { $in: gameIds } });
        const playersToBan = new Set();
        games.forEach(game => {
            if (game.white) playersToBan.add(game.white);
            if (game.black) playersToBan.add(game.black);
        });

        const playerList = Array.from(playersToBan);

        // Update players status
        const Player = (await import('../models/Player.js')).default;
        await Player.updateMany(
            { username: { $in: playerList } },
            { status: 'banned', notes: `Banned via bulk moderation: ${reason}` }
        );

        // Also terminate the games
        await Game.updateMany({ _id: { $in: gameIds } }, { status: 'terminated' });
        await GameMod.updateMany(
            { gameId: { $in: gameIds } },
            { status: 'TERMINATED', reviewedBy: req.user._id, decision: `BANNED: ${reason}` }
        );

        await createAuditEntry(req, 'BAN', 'MULTIPLE', `Bulk banned players from ${gameIds.length} games: ${reason}`);
        res.json({ message: `Successfully banned players from ${gameIds.length} games`, affectedPlayers: playerList.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const exportGamesPGN = async (req, res) => {
    try {
        const { gameIds } = req.body;
        const games = await Game.find({ _id: { $in: gameIds } });

        let pgnContent = '';
        games.forEach(game => {
            if (game.pgn) {
                pgnContent += game.pgn + '\n\n';
            }
        });

        res.setHeader('Content-Type', 'text/plain');
        res.send(pgnContent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

