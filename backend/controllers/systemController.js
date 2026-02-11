import SystemSetting from '../models/SystemSetting.js';
import Player from '../models/Player.js';
import Game from '../models/Game.js';
import GameMod from '../models/GameMod.js';
import { createAuditEntry } from '../utils/auditLogger.js';

// @desc    Get all system settings
export const getSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.find({});
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update or create a system setting
export const updateSetting = async (req, res) => {
    try {
        const { key, value, description } = req.body;

        const setting = await SystemSetting.findOneAndUpdate(
            { key },
            { value, description, lastUpdatedBy: req.user?._id },
            { upsert: true, new: true }
        );

        // Map internal keys to tactical audit actions
        let auditAction = 'SETTINGS_UPDATE';
        if (key === 'maintenance_mode') {
            auditAction = value === 'true' ? 'SYSTEM_KILLSWITCH' : 'UNBAN'; // Using UNBAN as a proxy for 'Restore'
        } else if (key === 'global_broadcast') {
            auditAction = 'BROADCAST';
        }

        await createAuditEntry(req, auditAction, key, `Value set to: ${value}`);

        res.json(setting);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get a specific setting by key
// @route   GET /api/system/settings/:key
// @access  Public
export const getSettingByKey = async (req, res) => {
    try {
        const setting = await SystemSetting.findOne({ key: req.params.key });
        if (setting) {
            res.json(setting);
        } else {
            res.status(404).json({ message: 'Setting not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Seed database with test users
// @route   POST /api/system/seed
// @access  Admin
export const seedUsers = async (req, res) => {
    try {
        const playerCount = await Player.countDocuments();
        const gameCount = await Game.countDocuments();
        let message = '';

        if (playerCount > 0 && gameCount > 0) {
            return res.status(400).json({ message: 'Database already has data. Seed aborted to prevent data loss.' });
        }

        let createdPlayers = [];
        if (playerCount === 0) {
            const players = [
                {
                    username: 'Magnus_C',
                    email: 'magnus@chess.com',
                    phone: '1234567890',
                    password: 'password123',
                    elo: 2800,
                    games: 500,
                    wins: 450,
                    losses: 30,
                    draws: 20,
                    status: 'active',
                    isVerified: true,
                    city: 'Oslo',
                    country: 'Norway'
                },
                {
                    username: 'Hikaru_N',
                    email: 'hikaru@chess.com',
                    phone: '1234567891',
                    password: 'password123',
                    elo: 2750,
                    games: 450,
                    wins: 400,
                    losses: 35,
                    draws: 15,
                    status: 'active',
                    isVerified: true,
                    city: 'St. Louis',
                    country: 'USA'
                },
                {
                    username: 'Cheater123',
                    email: 'cheater@chess.com',
                    phone: '1234567892',
                    password: 'password123',
                    elo: 2500,
                    games: 300,
                    wins: 280,
                    losses: 15,
                    draws: 5,
                    status: 'banned',
                    isVerified: true,
                    city: 'Unknown',
                    country: 'Unknown',
                    fairPlayRiskScore: 95
                },
                {
                    username: 'Riyank12344',
                    email: 'riyank@chess.com',
                    phone: '1234567893',
                    password: 'password123',
                    elo: 2600,
                    games: 350,
                    wins: 320,
                    losses: 25,
                    draws: 5,
                    status: 'active',
                    isVerified: true,
                    city: 'New Delhi',
                    country: 'India'
                }
            ];
            createdPlayers = await Player.create(players);
            message += `Seeded ${createdPlayers.length} players. `;
        }

        if (gameCount === 0) {
            const games = [
                {
                    white: 'Magnus_C',
                    black: 'Hikaru_N',
                    whiteElo: '2800',
                    blackElo: '2750',
                    timeControl: '3+2',
                    status: 'playing',
                    moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6',
                    duration: '0:45'
                },
                {
                    white: 'Riyank12344',
                    black: 'Cheater123',
                    whiteElo: '2600',
                    blackElo: '2500',
                    timeControl: '10+0',
                    status: 'playing',
                    moves: '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4',
                    duration: '2:10'
                },
                {
                    white: 'Magnus_C',
                    black: 'Riyank12344',
                    whiteElo: '2800',
                    blackElo: '2600',
                    timeControl: '5+0',
                    status: 'finished',
                    result: '1-0',
                    moves: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6',
                    pgn: '[Event "Blitz"]\n[Site "Nexus"]\n[Date "2024.01.01"]\n[Round "1"]\n[White "Magnus_C"]\n[Black "Riyank12344"]\n[Result "1-0"]\n\n1. e4 c5 1-0'
                },
                {
                    white: 'Cheater123',
                    black: 'Hikaru_N',
                    whiteElo: '2500',
                    blackElo: '2750',
                    timeControl: '1+0',
                    status: 'finished',
                    result: '0-1',
                    moves: '1. e4 e5 2. Ke2', // Bongcloud
                    pgn: '[Event "Bullet"]\n[Site "Nexus"]\n[Date "2024.01.01"]\n[Round "1"]\n[White "Cheater123"]\n[Black "Hikaru_N"]\n[Result "0-1"]\n\n1. e4 e5 2. Ke2 0-1'
                }
            ];
            const createdGames = await Game.create(games);
            message += `Seeded ${createdGames.length} games. `;

            // Seed some moderations for these games
            const moderations = [
                {
                    gameId: createdGames[1]._id,
                    whitePlayer: 'Riyank12344',
                    blackPlayer: 'Cheater123',
                    reason: 'ENGINE_USE',
                    severity: 'HIGH',
                    status: 'FLAGGED',
                    reportedBy: 'SYSTEM'
                },
                {
                    gameId: createdGames[3]._id,
                    whitePlayer: 'Cheater123',
                    blackPlayer: 'Hikaru_N',
                    reason: 'HARASSMENT',
                    severity: 'MEDIUM',
                    status: 'UNDER_REVIEW',
                    reportedBy: 'Hikaru_N'
                }
            ];
            await GameMod.create(moderations);
            message += `Seeded moderation entries.`;
        }

        await createAuditEntry(req, 'SYSTEM_INIT', 'ALL', `Database population: ${message}`);

        res.status(201).json({
            message: message || 'Database already populated',
            count: createdPlayers.length
        });
    } catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({ message: error.message });
    }
};
