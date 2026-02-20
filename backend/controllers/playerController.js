import Player from '../models/Player.js';
import Game from '../models/Game.js';

// @desc    Get current player profile
// @route   GET /api/players/profile
// @access  Private
export const getProfile = async (req, res) => {
    try {
        const player = await Player.findById(req.user._id).select('-password');
        if (player) {
            res.json(player);
        } else {
            res.status(404).json({ message: 'Player not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update player profile
// @route   PUT /api/players/profile
// @access  Private
export const updateProfile = async (req, res) => {
    try {
        const player = await Player.findById(req.user._id);

        if (player) {
            player.username = req.body.username || player.username;
            player.email = req.body.email || player.email;
            if (req.body.avatar !== undefined) {
                player.avatar = req.body.avatar;
            }
            if (req.body.privacySettings) {
                player.privacySettings = {
                    ...player.privacySettings,
                    ...req.body.privacySettings
                };
            }
            if (req.body.settings) {
                player.settings = {
                    ...player.settings,
                    ...req.body.settings
                };
            }
            if (req.body.twoFactorAuth !== undefined) {
                player.twoFactorAuth = {
                    ...player.twoFactorAuth,
                    ...req.body.twoFactorAuth
                };
            }
            // Add other fields as necessary

            const updatedPlayer = await player.save();

            res.json({
                _id: updatedPlayer._id,
                username: updatedPlayer.username,
                email: updatedPlayer.email,
                avatar: updatedPlayer.avatar,
                privacySettings: updatedPlayer.privacySettings,
                settings: updatedPlayer.settings,
                twoFactorAuth: updatedPlayer.twoFactorAuth,
                token: req.headers.authorization.split(' ')[1]
            });
        } else {
            res.status(404).json({ message: 'Player not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Change player password
// @route   PUT /api/players/change-password
// @access  Private
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const player = await Player.findById(req.user._id);

        if (player && (await player.matchPassword(currentPassword))) {
            player.password = newPassword;
            await player.save();
            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(401).json({ message: 'Invalid current password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get player rating history
// @route   GET /api/players/rating-history
// @access  Private
export const getRatingHistory = async (req, res) => {
    try {
        // Fetch last 50 games for the user
        const games = await Game.find({
            $or: [{ white: req.user._id }, { black: req.user._id }],
            status: 'finished'
        })
            .sort({ createdAt: 1 }) // Chronological order
            .select('white black whiteElo blackElo createdAt result')
            .limit(50);

        const history = games.map(game => {
            const isWhite = game.white.toString() === req.user._id.toString();
            const elo = isWhite ? game.whiteElo : game.blackElo;
            return {
                date: game.createdAt,
                elo: parseInt(elo) || 1200, // Handle potential non-numeric ELO if it was stored as string
                gameId: game._id
            };
        });

        // Add current ELO as the latest point if no games or to ensure current state is reflected
        // But the user might want a history graph. 
        // If user has 0 games, return default 1200
        if (history.length === 0) {
            history.push({ date: new Date(), elo: 1200 });
        }

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get detailed player analytics
// @route   GET /api/players/analytics
// @access  Private
export const getAnalytics = async (req, res) => {
    try {
        const games = await Game.find({
            $or: [{ white: req.user._id }, { black: req.user._id }],
            status: 'finished'
        });

        const stats = {
            totalGames: games.length,
            wins: 0,
            losses: 0,
            draws: 0,
            timeControlStats: {}, // { '10+0': { wins: 0, total: 0 } }
            openings: {}, // { 'e4': 5, 'd4': 3 }
            opponentStrength: 0,
            winRate: 0
        };

        if (games.length === 0) {
            return res.json(stats);
        }

        let totalOpponentElo = 0;

        games.forEach(game => {
            const isWhite = game.white.toString() === req.user._id.toString();
            const result = game.result;

            // Win / Loss / Draw
            if (result === '1/2-1/2') {
                stats.draws++;
            } else if ((isWhite && result === '1-0') || (!isWhite && result === '0-1')) {
                stats.wins++;
            } else {
                stats.losses++;
            }

            // Time Control
            const tc = game.timeControl || 'Unknown';
            if (!stats.timeControlStats[tc]) stats.timeControlStats[tc] = { wins: 0, losses: 0, draws: 0, total: 0 };
            stats.timeControlStats[tc].total++;
            if (result === '1/2-1/2') stats.timeControlStats[tc].draws++;
            else if ((isWhite && result === '1-0') || (!isWhite && result === '0-1')) stats.timeControlStats[tc].wins++;
            else stats.timeControlStats[tc].losses++;

            // Opponent ELO
            totalOpponentElo += parseInt(isWhite ? game.blackElo : game.whiteElo) || 1200;

            // Opening (First move extraction if PGN exists)
            if (game.pgn) {
                const firstMoveMatch = game.pgn.match(/1\.\s+([a-zA-Z0-9+#=]+)/);
                if (firstMoveMatch) {
                    const move = firstMoveMatch[1];
                    stats.openings[move] = (stats.openings[move] || 0) + 1;
                }
            }
        });

        stats.winRate = ((stats.wins / stats.totalGames) * 100).toFixed(1);
        stats.opponentStrength = Math.round(totalOpponentElo / games.length);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

