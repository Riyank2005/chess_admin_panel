import { Chess } from 'chess.js';
import Game from '../models/Game.js';
import Tournament from '../models/Tournament.js';

// In-memory storage for active games and matchmaking queue
const matches = new Map(); // gameId -> { chessInstance, whiteId, blackId, timeControl }
const matchmakingQueue = []; // [{ userId, socketId, timeControl, elo }]

export const handleGameSocket = (io, socket) => {
    // Join a private room for DMs
    const userId = socket.handshake.query.userId;
    if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[SOCKET] 👤 User ${userId} connected and joined private room`);
    }

    // --- Direct Messages ---
    socket.on('send_dm', async ({ receiverId, message, senderId }) => {
        const msg = {
            sender: senderId,
            receiver: receiverId,
            message,
            createdAt: new Date()
        };
        // Emit to receiver's private room
        io.to(`user:${receiverId}`).emit('receive_dm', msg);
        // Also emit back to sender (for multiple tabs/sync)
        io.to(`user:${senderId}`).emit('receive_dm', msg);
    });

    // --- Matchmaking ---
    socket.on('join_matchmaking', async ({ userId, username, timeControl, elo }) => {
        console.log(`[SOCKET] 🔍 User ${username || userId} joined matchmaking for ${timeControl}`);

        const opponentIndex = matchmakingQueue.findIndex(p => p.timeControl === timeControl && p.userId !== userId);

        if (opponentIndex > -1) {
            const opponent = matchmakingQueue.splice(opponentIndex, 1)[0];
            const player = { userId, username, socketId: socket.id, timeControl, elo };

            try {
                const white = Math.random() > 0.5 ? player : opponent;
                const black = white.userId === player.userId ? opponent : player;

                const newGame = await Game.create({
                    white: white.userId,
                    black: black.userId,
                    whiteElo: white.elo,
                    blackElo: black.elo,
                    timeControl,
                    status: 'playing',
                    moves: '0',
                    pgn: ''
                });

                const gameId = newGame._id.toString();
                matches.set(gameId, {
                    chess: new Chess(),
                    white: white.userId,
                    black: black.userId,
                    lastMoveTime: Date.now()
                });

                io.to(white.socketId).emit('match_found', {
                    gameId,
                    color: 'white',
                    opponent: { _id: black.userId, username: black.username, elo: black.elo },
                    game: newGame
                });
                io.to(black.socketId).emit('match_found', {
                    gameId,
                    color: 'black',
                    opponent: { _id: white.userId, username: white.username, elo: white.elo },
                    game: newGame
                });

                // Join socket rooms
                io.sockets.sockets.get(white.socketId)?.join(`game:${gameId}`);
                io.sockets.sockets.get(black.socketId)?.join(`game:${gameId}`);

                console.log(`[SOCKET] ⚔️ Match created: ${gameId}`);
            } catch (error) {
                console.error('[SOCKET] Error creating match:', error);
                socket.emit('error', 'Failed to create match');
            }
        } else {
            // Prevent duplicate entries in matchmaking queue
            const alreadyInQueue = matchmakingQueue.some(p => p.userId === userId);
            if (!alreadyInQueue) {
                matchmakingQueue.push({ userId, username, socketId: socket.id, timeControl, elo });
                socket.emit('matchmaking_joined');
            } else {
                console.log(`[SOCKET] ℹ️ User ${userId} is already in matchmaking queue`);
                socket.emit('matchmaking_joined'); // Re-ack
            }
        }
    });

    socket.on('cancel_matchmaking', ({ userId }) => {
        const index = matchmakingQueue.findIndex(p => p.userId === userId);
        if (index > -1) {
            matchmakingQueue.splice(index, 1);
            socket.emit('matchmaking_canceled');
        }
    });

    // --- Game Actions ---
    socket.on('make_move', async ({ gameId, move, fen }) => {
        console.log(`[SOCKET] 📥 Move received for ${gameId}: ${move}`);

        let match = matches.get(gameId);
        if (!match) {
            console.warn(`[SOCKET] ❌ Game ${gameId} not in memory. Attempting to restore...`);
            try {
                const game = await Game.findById(gameId);
                if (game && game.status === 'playing') {
                    const chess = new Chess(game.fen || undefined);
                    if (game.pgn) chess.loadPgn(game.pgn);
                    match = {
                        chess,
                        white: game.white,
                        black: game.black,
                        lastMoveTime: Date.now()
                    };
                    matches.set(gameId, match);
                } else {
                    return socket.emit('error', 'Game not active or found');
                }
            } catch (err) {
                return socket.emit('error', 'Failed to restore game session');
            }
        }

        try {
            const result = match.chess.move(move);
            if (result) {
                console.log(`[SOCKET] ✅ Move validated: ${result.san}`);

                // Update DB
                Game.findByIdAndUpdate(gameId, {
                    $set: {
                        fen: match.chess.fen(),
                        pgn: match.chess.pgn(),
                        moves: match.chess.history().length.toString()
                    }
                }).catch(err => console.error('[SOCKET] DB Update Error:', err));

                // Broadcast move to both players in the room
                io.to(`game:${gameId}`).emit('game_move', {
                    move: result,
                    fen: match.chess.fen(),
                    history: match.chess.history({ verbose: true }),
                    pgn: match.chess.pgn()
                });

                // Check Game Over
                if (match.chess.isGameOver()) {
                    let reason = 'finished';
                    if (match.chess.isCheckmate()) reason = 'checkmate';
                    else if (match.chess.isDraw()) reason = 'draw';
                    else if (match.chess.isStalemate()) reason = 'stalemate';

                    const winner = match.chess.turn() === 'w' ? 'black' : 'white';

                    io.to(`game:${gameId}`).emit('game_over', { reason, winner });
                    matches.delete(gameId);

                    const resultStr = reason === 'checkmate' ? (winner === 'white' ? '1-0' : '0-1') : '1/2-1/2';

                    Game.findByIdAndUpdate(gameId, {
                        status: 'finished',
                        result: resultStr
                    }).then(async (game) => {
                        // Propagate to tournament if applicable
                        if (game && game.tournamentId) {
                            const tournament = await Tournament.findById(game.tournamentId);
                            if (tournament) {
                                tournament.rounds.forEach(round => {
                                    const m = round.pairings.find(p => p.gameId && p.gameId.toString() === gameId);
                                    if (m) {
                                        m.result = resultStr;
                                        // Update points
                                        const wIdx = tournament.enrolledPlayers.findIndex(p => p.player.toString() === m.white.toString());
                                        const bIdx = tournament.enrolledPlayers.findIndex(p => p.player.toString() === m.black.toString());
                                        if (resultStr === '1-0') tournament.enrolledPlayers[wIdx].points += 1;
                                        else if (resultStr === '0-1') tournament.enrolledPlayers[bIdx].points += 1;
                                        else if (resultStr === '1/2-1/2') {
                                            if (wIdx > -1) tournament.enrolledPlayers[wIdx].points += 0.5;
                                            if (bIdx > -1) tournament.enrolledPlayers[bIdx].points += 0.5;
                                        }
                                    }
                                });
                                await tournament.save();
                            }
                        }
                    }).catch(err => console.error('[SOCKET] Final DB Update Error:', err));
                }
            } else {
                console.warn(`[SOCKET] ❌ Illegal move for ${gameId}:`, move);
                socket.emit('error', 'Illegal move');
            }
        } catch (e) {
            console.error('[SOCKET] Move Exception:', e);
            socket.emit('error', 'Error processing move');
        }
    });

    socket.on('join_game_room', async ({ gameId }) => {
        socket.join(`game:${gameId}`);
        let match = matches.get(gameId);

        if (!match) {
            try {
                const game = await Game.findById(gameId);
                if (game && game.status === 'playing') {
                    const chess = new Chess(game.fen || undefined);
                    if (game.pgn) chess.loadPgn(game.pgn);
                    match = {
                        chess,
                        white: game.white,
                        black: game.black,
                        lastMoveTime: Date.now()
                    };
                    matches.set(gameId, match);
                }
            } catch (err) {
                console.error('Failed to restore game:', err);
            }
        }

        if (match) {
            socket.emit('game_state', {
                fen: match.chess.fen(),
                pgn: match.chess.pgn(),
                turn: match.chess.turn(),
                history: match.chess.history({ verbose: true })
            });
        }
    });

    socket.on('resign', ({ gameId, userId }) => {
        const match = matches.get(gameId);
        if (match) {
            const winner = match.white === userId ? 'black' : 'white';
            const reason = 'resignation';
            io.to(`game:${gameId}`).emit('game_over', { reason, winner });
            matches.delete(gameId);

            const resultStr = winner === 'white' ? '1-0' : '0-1';

            Game.findByIdAndUpdate(gameId, {
                status: 'finished',
                result: resultStr
            }).then(async (game) => {
                if (game && game.tournamentId) {
                    const tournament = await Tournament.findById(game.tournamentId);
                    if (tournament) {
                        tournament.rounds.forEach(round => {
                            const m = round.pairings.find(p => p.gameId && p.gameId.toString() === gameId);
                            if (m) {
                                m.result = resultStr;
                                const wIdx = tournament.enrolledPlayers.findIndex(p => p.player.toString() === m.white.toString());
                                const bIdx = tournament.enrolledPlayers.findIndex(p => p.player.toString() === m.black.toString());
                                if (resultStr === '1-0') tournament.enrolledPlayers[wIdx].points += 1;
                                else if (resultStr === '0-1') tournament.enrolledPlayers[bIdx].points += 1;
                            }
                        });
                        await tournament.save();
                    }
                }
            }).catch(err => console.error('[SOCKET] Resign Error:', err));
        }
    });

    // --- Chat & Draw ---
    socket.on('send_chat', async ({ gameId, sender, text }) => {
        io.to(`game:${gameId}`).emit('chat_message', { sender, text, time: new Date() });
        // Optional: Persist to DB
        await Game.findByIdAndUpdate(gameId, {
            $push: { messages: { sender, text } }
        });
    });

    socket.on('offer_draw', ({ gameId, userId }) => {
        const match = matches.get(gameId);
        if (match) {
            const color = match.white === userId ? 'white' : 'black';
            match.drawOffer = color;
            io.to(`game:${gameId}`).emit('draw_offered', { color });
        }
    });

    socket.on('accept_draw', async ({ gameId, userId }) => {
        const match = matches.get(gameId);
        if (match && match.drawOffer) {
            io.to(`game:${gameId}`).emit('game_over', { reason: 'agreement', winner: 'draw' });
            matches.delete(gameId);

            await Game.findByIdAndUpdate(gameId, {
                status: 'finished',
                result: '1/2-1/2'
            });
        }
    });

    socket.on('reject_draw', ({ gameId }) => {
        const match = matches.get(gameId);
        if (match) {
            match.drawOffer = null;
            io.to(`game:${gameId}`).emit('draw_rejected');
        }
    });
};
