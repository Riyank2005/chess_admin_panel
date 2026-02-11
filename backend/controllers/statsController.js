
import Player from '../models/Player.js';
import Game from '../models/Game.js';
import Broadcast from '../models/Broadcast.js';

// @desc    Get dashboard statistics
// @route   GET /api/system/stats
export const getSystemStats = async (req, res) => {
    try {
        const usersCount = await Player.countDocuments();
        const activeGamesCount = await Game.countDocuments({ status: 'playing' }); // status is 'playing' in model
        const broadcastsCount = await Broadcast.countDocuments();

        // Count users with high risk
        const alertCount = await Player.countDocuments({
            $or: [
                { status: 'banned' },
                { isShadowBanned: true },
                { fairPlayRiskScore: { $gt: 70 } }
            ]
        });

        res.json({
            users: usersCount,
            activeGames: activeGamesCount,
            activeHalls: broadcastsCount, // Using broadcasts as proxy for 'halls' or just general activity for now
            alerts: alertCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
