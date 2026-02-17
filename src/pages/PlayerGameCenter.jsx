import { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Play, Computer, History, Zap, User, Sword, Trophy, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useWebSocket } from "@/context/WebSocketContext";
import { useAuth } from "@/context/AuthContext";
import { Chess } from 'chess.js';
import { Chessboard } from "react-chessboard";

const PIECES_MAP = {
    'p': '♟',
    'n': '♞',
    'b': '♝',
    'r': '♜',
    'q': '♛',
    'k': '♚'
};

const PlayerGameCenter = () => {
    const { socket, connected, emit } = useWebSocket();
    const { user } = useAuth();
    console.log('[DEBUG] Game Center Mounting. User:', user?.username, 'Socket:', socket?.id);

    // Use ref to keep track of latest game state for socket listeners
    const gameRef = useRef(null);
    try {
        if (!gameRef.current) gameRef.current = new Chess();
    } catch (e) {
        console.error('[CRITICAL] Chess engine failed to initialize:', e);
    }

    // UI State
    const [view, setView] = useState('lobby'); // lobby, matchmaking, playing, analysis
    const [gameMode, setGameMode] = useState(null); // 'online', 'computer'
    const [difficulty, setDifficulty] = useState('Novice');

    // Game State
    const [game, setGame] = useState(new Chess());
    const [fen, setFen] = useState('start');
    const [gameId, setGameId] = useState(null);
    const [orientation, setOrientation] = useState('white');
    const [opponent, setOpponent] = useState(null);
    const [moveHistory, setMoveHistory] = useState([]);
    const [gameOver, setGameOver] = useState(null);
    const [moveFrom, setMoveFrom] = useState('');
    const [hintSquares, setHintSquares] = useState({});
    const [moveTo, setMoveTo] = useState(null);
    const [showHint, setShowHint] = useState(false);
    const [optionSquares, setOptionSquares] = useState({});
    const [rightClickedSquares, setRightClickedSquares] = useState({});
    const [turn, setTurn] = useState('w');
    const [playerColor, setPlayerColor] = useState('white');
    const [activeMatches, setActiveMatches] = useState([]);
    const [lastMoveSquares, setLastMoveSquares] = useState({});
    const [hoveredOrigin, setHoveredOrigin] = useState(null);
    const [capturedPieces, setCapturedPieces] = useState({ w: [], b: [] });

    // Timer State
    const [whiteTime, setWhiteTime] = useState(600);
    const [blackTime, setBlackTime] = useState(600);
    const [timerActive, setTimerActive] = useState(false);

    const [activeGames, setActiveGames] = useState([]);
    const [gameStarting, setGameStarting] = useState(false);
    const [startMessage, setStartMessage] = useState("BATTLE START");

    const START_PHRASES = [
        "BATTLE START",
        "CHESS MASTER",
        "TIME TO CLIMB",
        "CHECKMATE READY",
        "VICTORY AWAITS"
    ];

    // Atomic Game Update Helper
    const updateGame = (newChessInstance, externalHistory = null) => {
        const newFen = newChessInstance.fen();
        console.log('[SYNC] 🔄 Position Update:', newFen);

        gameRef.current = newChessInstance;
        // Optimization: Just update state from existing instance
        setGame(new Chess(newFen));
        setFen(newFen);
        setTurn(newChessInstance.turn());

        // Update history
        const history = externalHistory || newChessInstance.history({ verbose: true });
        setMoveHistory(history);

        // Update last move highlights
        if (history.length > 0) {
            const lastMove = history[history.length - 1];
            setLastMoveSquares({
                [lastMove.from]: { backgroundColor: "#f9f06e80" },
                [lastMove.to]: { backgroundColor: "#f9f06e80" }
            });
        } else {
            setLastMoveSquares({});
        }

        // Calculate captured pieces
        const captured = { w: [], b: [] };
        history.forEach(m => {
            if (m.captured) {
                // If white made the move and captured, the captured piece was black
                const capturedColor = m.color === 'w' ? 'b' : 'w';
                captured[capturedColor].push(m.captured);
            }
        });
        setCapturedPieces(captured);

        // Check game over
        checkGameOver(newChessInstance);

        // Sound logic
        if (history.length > 0) {
            const lastMove = history[history.length - 1];
            let soundUrl = 'https://images.chesscomfiles.com/chess-themes/sounds/_common/move-self.mp3';
            if (newChessInstance.inCheck()) {
                soundUrl = 'https://images.chesscomfiles.com/chess-themes/sounds/_common/move-check.mp3';
            } else if (lastMove.captured) {
                soundUrl = 'https://images.chesscomfiles.com/chess-themes/sounds/_common/capture.mp3';
            }

            try {
                const audio = new Audio(soundUrl);
                audio.play().catch(() => { });
            } catch (e) { }
        }

        // Auto-scroll
        setTimeout(() => {
            const el = document.getElementById('move-history-container');
            if (el) el.scrollTop = el.scrollHeight;
        }, 100);
    };

    // Timer Logic
    useEffect(() => {
        let interval;
        if (timerActive && !gameOver && view === 'playing') {
            interval = setInterval(() => {
                const turn = gameRef.current.turn();
                if (turn === 'w') {
                    setWhiteTime(prev => {
                        if (prev <= 0) {
                            setGameOver({ reason: 'time', winner: 'black' });
                            setTimerActive(false);
                            return 0;
                        }
                        return prev - 1;
                    });
                } else {
                    setBlackTime(prev => {
                        if (prev <= 0) {
                            setGameOver({ reason: 'time', winner: 'white' });
                            setTimerActive(false);
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive, gameOver, view]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Fetch active games on load
    useEffect(() => {
        const fetchActiveGames = async () => {
            if (!user) return;
            try {
                const response = await fetch(`/api/games?status=playing&limit=5&participant=${user._id}`);
                if (response.ok) {
                    const data = await response.json();
                    setActiveGames(data.games || []);
                }
            } catch (e) {
                console.error("Failed to fetch games", e);
            }
        };
        fetchActiveGames();
        // Refresh every 30s
        const interval = setInterval(fetchActiveGames, 30000);
        return () => clearInterval(interval);
    }, [user._id]);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('match_found', (data) => {
            console.log('Match found!', data);
            setGameId(data.gameId);
            setOrientation(data.color);
            setOpponent(data.opponent); // Now full object from server
            setGameMode('online');

            // Reset game board
            const newGame = new Chess();
            updateGame(newGame);

            setWhiteTime(600);
            setBlackTime(600);
            setTimerActive(false);

            // Trigger Game Start Animation
            const randomPhrase = START_PHRASES[Math.floor(Math.random() * START_PHRASES.length)];
            setStartMessage(randomPhrase);
            setGameStarting(true);
            setTimeout(() => {
                setGameStarting(false);
                setTimerActive(true);
            }, 1000);

            setView('playing');
            toast.success(`Match found! You are playing ${data.color}.`);
        });

        socket.on('game_move', (data) => {
            console.log('[SOCKET] 📦 Move received:', data);

            // Check if this move is already reflected in our local state
            if (data.fen !== gameRef.current.fen()) {
                console.log('[LOCAL] 🔄 Syncing state with server. Moves:', data.history?.length);
                const syncGame = new Chess(data.fen);
                updateGame(syncGame, data.history);
            }
        });

        socket.on('game_state', (data) => {
            console.log('[SOCKET] 🛡️ Game state received:', data);
            const syncGame = new Chess(data.fen);
            updateGame(syncGame, data.history);
            setTimerActive(true);
        });

        socket.on('game_over', (data) => {
            setGameOver(data);
            setTimerActive(false);
            toast.info(`Game Over: ${data.reason}. Winner: ${data.winner}`);
        });

        socket.on('matchmaking_joined', () => {
            setView('matchmaking');
        });

        return () => {
            socket.off('match_found');
            socket.off('game_move');
            socket.off('game_state');
            socket.off('game_over');
            socket.off('matchmaking_joined');
        };
    }, [socket, gameId]);

    // Matchmaking Functions
    const startMatchmaking = () => {
        if (!connected) {
            toast.error("Not connected to server!");
            return;
        }
        emit('join_matchmaking', {
            userId: user._id,
            username: user.username,
            timeControl: '10+0',
            elo: user.elo || 1200
        });
    };

    const resumeGame = (gameData) => {
        const gid = gameData._id || gameData.id;
        setGameId(gid);
        setGameMode('online');
        // Determine orientation
        const isWhite = (typeof gameData.white === 'object') ? gameData.white._id === user._id : gameData.white === user._id;
        const color = isWhite ? 'white' : 'black';
        setOrientation(color);
        setPlayerColor(color);
        setOpponent(isWhite ? gameData.black : gameData.white);

        // Request full state from server
        emit('join_game_room', { gameId: gid });
        setView('playing');
        toast.info("Resuming battle...");
    };

    // Auto-trigger computer move when turn changes
    useEffect(() => {
        if (gameMode === 'computer' && !gameOver && !gameStarting && view === 'playing') {
            const pColor = playerColor.charAt(0);
            if (gameRef.current.turn() !== pColor) {
                // Engine's turn - trigger logic
                const timer = setTimeout(triggerComputerMove, 800);
                return () => clearTimeout(timer);
            } else {
                // User's turn - light up their pieces subtly
                const ownPieces = {};
                const board = gameRef.current.board();
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        const p = board[r][c];
                        if (p && p.color === pColor) {
                            const sq = String.fromCharCode(97 + c) + (8 - r);
                            ownPieces[sq] = {
                                boxShadow: 'inset 0 0 10px rgba(99, 102, 241, 0.4)',
                                background: 'rgba(99, 102, 241, 0.05)'
                            };
                        }
                    }
                }
                setHintSquares(ownPieces);
            }
        } else {
            setHintSquares({});
        }
    }, [turn, gameMode, gameOver, gameStarting, view, playerColor]);

    const cancelMatchmaking = () => {
        emit('cancel_matchmaking', { userId: user._id });
        setView('lobby');
    };

    // Helper function to get legal moves for a square (ULTRA BRIGHT PURPLE)
    const getMoveOptions = (square) => {
        const moves = gameRef.current.moves({
            square,
            verbose: true,
        });

        if (moves.length === 0) {
            setOptionSquares({});
            return false;
        }

        const newSquares = {};

        // POPUP: This tells the user immediately that paths are found
        toast.info(`PATHS FOUND: ${moves.length} moves available!`, {
            id: 'path-logic',
            duration: 1500
        });

        moves.forEach((move) => {
            const pieceOnTarget = gameRef.current.get(move.to);

            newSquares[move.to] = pieceOnTarget
                ? {
                    // Capture: Solid Bright Red
                    backgroundColor: "rgba(220, 38, 38, 0.9)",
                    border: "6px solid #b91c1c",
                    borderRadius: "4px"
                }
                : {
                    // Normal Move: Solid Bright Purple (MAGIC PATH)
                    backgroundColor: "rgba(147, 51, 234, 0.9)",
                    border: "6px solid #7e22ce",
                    borderRadius: "4px"
                };
        });

        // Highlight the piece in BRILLIANT GOLD
        newSquares[square] = {
            backgroundColor: "rgba(255, 215, 0, 0.9)",
            border: "8px solid #FFD700",
            boxShadow: "0 0 50px rgba(255, 215, 0, 1)",
            zIndex: 1000
        };

        setOptionSquares(newSquares);
        return true;
    };

    // Get check square highlighting
    const getCheckSquare = () => {
        if (!gameRef.current.inCheck()) return {};

        const squares = {};
        const board = gameRef.current.board();

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece && piece.type === 'k' && piece.color === gameRef.current.turn()) {
                    const files = 'abcdefgh';
                    const square = files[j] + (8 - i);
                    squares[square] = {
                        background: "radial-gradient(circle, rgba(255, 0, 0, 0.6) 50%, transparent 50%)",
                    };
                }
            }
        }
        return squares;
    };

    // Handle Hover (Sticky Magic Path)
    const onMouseOverSquare = (square) => {
        if (gameOver || gameStarting) return;

        const currentTurnColor = gameRef.current.turn();
        const pColorChar = playerColor.toLowerCase().charAt(0);

        // Show paths ONLY on your turn
        if (currentTurnColor !== pColorChar) return;

        const piece = gameRef.current.get(square);

        // 1. If pointing at your OWN piece - Show its paths
        if (piece && piece.color === pColorChar) {
            setHoveredOrigin(square); // Use the correct state variable
            getMoveOptions(square);
        }
        // 2. If pointing at an active PATH - Keep it visible!
        else if (optionSquares[square]) {
            // Magnetic Lock: keep the current path dots on screen
        }
        // 3. Otherwise, if no piece is clicked, clear everything
        else if (!moveFrom) {
            setHoveredOrigin(null);
            setOptionSquares({});
        }
    };

    const onMouseOutSquare = () => {
        // We keep it sticky - clearing is handled by onMouseOverSquare
    };

    // Handle square click for move selection
    const onSquareClick = (square) => {
        if (gameOver) return;

        const currentTurn = gameRef.current.turn();
        const pColor = playerColor.charAt(0);

        console.log(`[USER_INTERACT] Square Clicked: ${square} | Turn: ${currentTurn} | YourColor: ${pColor}`);

        // If it's not the user's turn
        if (currentTurn !== pColor) {
            toast.error("Wait for the computer to move!");
            return;
        }

        // Reset right-clicked squares
        setRightClickedSquares({});

        // Try to get the piece on the clicked square
        const piece = gameRef.current.get(square);

        // EXTRA LOGIC: If clicking a "Path" square while hovering, move instantly!
        if (!moveFrom && hoveredSquare && (optionSquares[square] || square === hoveredSquare)) {
            const fromSq = hoveredSquare;
            const pieceAtFrom = gameRef.current.get(fromSq);

            if (pieceAtFrom && pieceAtFrom.color === pColor) {
                const moveAttempt = {
                    from: fromSq,
                    to: square,
                    promotion: 'q',
                };

                const success = makeMove(moveAttempt);
                if (success) {
                    setOptionSquares({});
                    setHoveredSquare(null);
                    return;
                }
            }
        }

        // CASE 1: Standard Click-to-Select
        if (!moveFrom) {
            if (piece && piece.color === pColor) {
                console.log(`[CLICK] ✅ Selecting your piece at ${square}`);
                setMoveFrom(square);
                const movesFound = getMoveOptions(square);

                // SUCCESS MESSAGE: Tells you the piece is ready!
                if (movesFound) {
                    toast.success("Piece Selected! Now click a PURPLE box.", {
                        id: 'piece-selected',
                        duration: 2000,
                        position: 'top-center'
                    });
                } else {
                    toast.warning("This piece has no moves! Try another.", { id: 'no-moves' });
                    setMoveFrom('');
                }
            } else if (piece) {
                toast.error("That is not your piece! You are White.", { id: 'wrong-piece' });
            } else {
                toast.info("Click one of your White pieces first.", { id: 'info' });
            }
            return;
        }

        // CASE 2: Piece already selected, now choose target
        if (square === moveFrom) {
            console.log(`[CLICK] 🔙 Deselected ${square}`);
            setMoveFrom('');
            setOptionSquares({});
            return;
        }

        // Try to make the move
        const moveAttempt = {
            from: moveFrom,
            to: square,
            promotion: 'q',
        };

        const success = makeMove(moveAttempt);

        if (success) {
            console.log(`[CLICK] 🔥 Move Executed: ${moveFrom} -> ${square}`);
            setMoveFrom('');
            setOptionSquares({});
            setHintSquares({});
            toast.success("Nice move!");
        } else {
            // If they clicked another of their own pieces, switch selection
            if (piece && piece.color === pColor) {
                console.log(`[CLICK] 🔄 Switching selection to ${square}`);
                setMoveFrom(square);
                getMoveOptions(square);
            } else {
                console.log(`[CLICK] ❌ Invalid move target: ${square}`);
                toast.error("You can't move there! Select another piece or click a path.");
                // We keep the selection so they can try another dot
            }
        }
    };

    // Handle piece drop for drag-and-drop
    const onPieceDrop = (sourceSquare, targetSquare) => {
        if (gameOver) return false;

        // Check if it's player's turn
        const pColor = playerColor.charAt(0);
        if (gameRef.current.turn() !== pColor) {
            toast.error("Not your turn!");
            return false;
        }

        const move = {
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q',
        };

        console.log(`[BOARD] 🖐️ Piece dropped from ${sourceSquare} to ${targetSquare}`);
        const success = makeMove(move);

        if (success) {
            setMoveFrom('');
            setOptionSquares({});
            console.log('[BOARD] ✅ Move success in onPieceDrop');
        } else {
            console.warn('[BOARD] ❌ Move failed in onPieceDrop');
        }

        return success;
    };

    // Right-click to mark squares
    const onSquareRightClick = (square) => {
        const color = "rgba(255, 0, 0, 0.5)";
        setRightClickedSquares({
            ...rightClickedSquares,
            [square]:
                rightClickedSquares[square] && rightClickedSquares[square].backgroundColor === color
                    ? undefined
                    : { backgroundColor: color },
        });
    };



    // Check game over conditions
    const checkGameOver = (chessGame) => {
        if (chessGame.isCheckmate()) {
            const winner = chessGame.turn() === 'w' ? 'black' : 'white';
            setGameOver({ reason: 'checkmate', winner });
            toast.success(`Checkmate! ${winner === orientation ? 'You win!' : 'You lose!'}`);
            return true;
        } else if (chessGame.isDraw()) {
            setGameOver({ reason: 'draw', winner: null });
            toast.info("Game drawn!");
            return true;
        } else if (chessGame.isStalemate()) {
            setGameOver({ reason: 'stalemate', winner: null });
            toast.info("Stalemate!");
            return true;
        } else if (chessGame.isThreefoldRepetition()) {
            setGameOver({ reason: 'repetition', winner: null });
            toast.info("Draw by repetition!");
            return true;
        } else if (chessGame.isInsufficientMaterial()) {
            setGameOver({ reason: 'insufficient material', winner: null });
            toast.info("Draw by insufficient material!");
            return true;
        }
        return false;
    };

    // Game Logic
    const makeMove = (moveDetails) => {
        if (gameOver || gameStarting) return false;

        const currentTurn = gameRef.current.turn();
        const pColor = playerColor.charAt(0);

        console.log(`[MOVE] ♟️ Turn Check: Player=${pColor}, Current=${currentTurn}`);

        if (currentTurn !== pColor) {
            toast.error("Not your turn!");
            return false;
        }

        try {
            // Preserve history by cloning with FEN+PGN or just moving on the current ref
            const gameCopy = new Chess();
            gameCopy.loadPgn(gameRef.current.pgn());
            const result = gameCopy.move(moveDetails);

            if (result) {
                console.log('[MOVE] ✅ Legal:', result.san);

                // Update local instances
                updateGame(gameCopy);

                if (!timerActive) setTimerActive(true);

                if (gameMode === 'online') {
                    console.log('[SOCKET] 📡 Sending move to server');
                    emit('make_move', {
                        gameId,
                        move: result.san,
                        fen: gameCopy.fen()
                    });
                } else if (gameMode === 'computer') {
                    setTimeout(triggerComputerMove, 600);
                }
                return true;
            } else {
                console.warn('[MOVE] ❌ Illegal move attempted');
                return false;
            }
        } catch (e) {
            console.error('[MOVE] ❌ Error executing move:', e);
            return false;
        }
    };

    const triggerComputerMove = () => {
        if (gameOver || view !== 'playing') return;

        try {
            const currentPgn = gameRef.current.pgn();
            const currentFen = gameRef.current.fen();

            const computerChess = new Chess(currentFen);
            if (currentPgn) computerChess.loadPgn(currentPgn);

            // Computer moves if it's NOT the player's turn color
            const pColor = playerColor.charAt(0);
            const computerTurn = computerChess.turn();

            if (computerTurn === pColor) {
                console.log('[AI] ✋ Not AI turn. Player color:', pColor, 'Turn:', computerTurn);
                return;
            }

            console.log('[AI] 🧠 Thinking... (Turn:', computerTurn, ')');
            const possibleMoves = computerChess.moves({ verbose: true });

            if (possibleMoves.length === 0) {
                console.warn('[AI] 🏳️ No moves available (GameOver?)');
                return;
            }

            console.log(`[AI] 🎲 Considering ${possibleMoves.length} possible moves`);

            // Simple AI logic: Capture if possible, else random
            const captures = possibleMoves.filter(m => m.captured);
            const moveToMake = captures.length > 0
                ? captures[Math.floor(Math.random() * captures.length)]
                : possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

            const result = computerChess.move(moveToMake);
            if (result) {
                console.log('[AI] 🤖 Executed:', result.san);
                updateGame(computerChess);
            } else {
                console.error('[AI] ❌ Move execution failed locally');
            }
        } catch (err) {
            console.error('[AI] ❌ Logic Error:', err);
        }
    };

    const startComputerGame = (level, side = 'white') => {
        setDifficulty(level);
        setGameMode('computer');
        setGameId('local-' + Date.now());
        setOrientation(side);
        setPlayerColor(side);
        setOpponent({ username: `Engine (Lvl ${level})` });

        const resetGame = new Chess();
        updateGame(resetGame);

        setWhiteTime(600);
        setBlackTime(600);
        setTimerActive(false);

        // Reset selection states
        setMoveFrom('');
        setOptionSquares({});
        setRightClickedSquares({});

        // Trigger Game Start Animation
        const randomPhrase = START_PHRASES[Math.floor(Math.random() * START_PHRASES.length)];
        setStartMessage(`${side === 'black' ? 'DEFEND YOUR POSITION' : 'COMMAND THE BOARD'}`);
        setGameStarting(true);
        setTimeout(() => {
            setGameStarting(false);
            setTimerActive(true);

            // If playing as black, engine moves first
            if (side === 'black') {
                setTimeout(triggerComputerMove, 500);
            }
        }, 1000);

        setView('playing');
    };

    const syncWithServer = () => {
        if (!gameId || gameMode !== 'online') return;
        console.log('[SYNC] 🔄 Manual sync requested');
        emit('join_game_room', { gameId });
        toast.info("Syncing game state...");
    };

    const resignGame = () => {
        if (gameMode === 'online') {
            emit('resign', { gameId, userId: user._id });
        } else {
            setGameOver({ reason: 'resignation', winner: 'black' });
            toast.info("You resigned.");
        }
    };

    // Components
    return (
        <div className="min-h-screen pb-12">
            {view === 'lobby' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 p-12 text-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.15),transparent)] pointer-events-none" />
                        <h1 className="text-5xl font-black text-white tracking-tight uppercase mb-4 drop-shadow-2xl">Game Center</h1>
                        <p className="text-white/40 font-medium mb-8">Ready to dominate the arena? Choose your mode and begin.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Button
                                onClick={() => startComputerGame('NOVICE', 'black')}
                                className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-white/90 font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                            >
                                <Sword className="w-5 h-5 mr-2 fill-current" />
                                START QUICK MATCH (ENGINE FIRST)
                            </Button>
                            <Button
                                onClick={startMatchmaking}
                                variant="outline"
                                className="h-14 px-8 rounded-2xl border-white/10 text-white hover:bg-white/5 font-black text-lg"
                            >
                                RANKED SEARCH
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Online Play */}
                        <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] p-8 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4">
                                <span className={`flex h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            </div>
                            <div className="p-4 rounded-2xl bg-indigo-500/20 w-fit mb-6">
                                <Sword className="w-8 h-8 text-indigo-400" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-white mb-4 uppercase">Ranked Matchmaking</CardTitle>
                            <p className="text-white/40 mb-8 font-medium">Standard 10+0 Rapid. Battle against players of similar skill level.</p>
                            <Button
                                onClick={startMatchmaking}
                                className="w-full h-16 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-lg shadow-lg shadow-indigo-500/20 group/btn overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                                INITIATE BATTLE
                            </Button>
                        </Card>

                        {/* Computer Play */}
                        <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] p-8 hover:border-purple-500/30 transition-all group">
                            <div className="p-4 rounded-2xl bg-purple-500/20 w-fit mb-6">
                                <Computer className="w-8 h-8 text-purple-400" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-white mb-4 uppercase">Engine Training</CardTitle>
                            <div className="flex gap-2 mb-8">
                                {['NOVICE', 'MASTER', 'GM'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => startComputerGame(level)}
                                        className="flex-1 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-white/40 hover:text-white hover:bg-white/10 hover:border-purple-500/30 transition-all uppercase"
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-4">
                                <Button
                                    onClick={() => startComputerGame('NOVICE', 'white')}
                                    className="flex-1 h-16 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs uppercase tracking-widest"
                                >
                                    ATTACK (WHITE)
                                </Button>
                                <Button
                                    onClick={() => startComputerGame('NOVICE', 'black')}
                                    className="flex-1 h-16 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs uppercase tracking-widest transition-all hover:scale-105"
                                >
                                    DEFEND (BLACK)
                                </Button>
                            </div>
                        </Card>
                    </div>

                    <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 p-8">
                            <div className="flex items-center gap-3">
                                <History className="w-6 h-6 text-indigo-400" />
                                <CardTitle className="text-xl font-bold text-white uppercase tracking-tight">Recent Battles</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className={cn("p-8", activeGames.length === 0 ? "p-16 text-center space-y-6" : "space-y-4")}>
                            {activeGames.length === 0 ? (
                                <>
                                    <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-2">
                                        <History className="w-10 h-10 text-white/20" />
                                    </div>
                                    <div>
                                        <p className="text-white/20 font-bold uppercase tracking-widest text-sm mb-2">No active games detected.</p>
                                        <p className="text-white/10 text-xs uppercase tracking-tighter">Your recent conquests will appear here.</p>
                                    </div>
                                </>
                            ) : (
                                <div className="grid gap-4">
                                    {activeGames.map((game) => (
                                        <div key={game._id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                                    <Sword className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white uppercase tracking-tight">
                                                        {game.white?._id === user._id ? (game.black?.username || 'Searching...') : (game.white?.username || 'Searching...')}
                                                    </div>
                                                    <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                                                        {game.timeControl} • {game.status}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => resumeGame(game)}
                                                className="bg-white/5 hover:bg-indigo-500 text-white border-white/5 text-[10px] font-black h-10 px-6 rounded-xl transition-all"
                                            >
                                                RESUME
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Button
                                onClick={startMatchmaking}
                                className="w-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 py-6 rounded-xl font-bold text-xs uppercase tracking-widest"
                            >
                                START NEW BATTLE
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {view === 'matchmaking' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse rounded-full" />
                        <div className="w-32 h-32 rounded-full border-4 border-indigo-500/30 flex items-center justify-center animate-spin relative bg-black/20 backdrop-blur-sm">
                            <Sword className="w-12 h-12 text-indigo-400 animate-pulse" />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Searching for Opponent</h2>
                        <p className="text-white/40 font-medium animate-pulse">Scanning global network...</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={cancelMatchmaking}
                        className="rounded-xl border-white/10 text-white hover:bg-white/5 hover:text-rose-400 font-bold"
                    >
                        CANCEL SEARCH
                    </Button>
                </div>
            )}

            {view === 'playing' && (
                <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4">
                    {/* Game Board Area */}
                    <div className="flex-1 space-y-4">
                        {/* Status Bar */}
                        <div className={cn(
                            "border rounded-xl px-4 py-2 text-center text-xs font-black tracking-widest uppercase transition-all duration-500",
                            turn === playerColor.charAt(0)
                                ? "bg-indigo-500/20 border-indigo-500 text-indigo-400 animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                                : "bg-white/5 border-white/5 text-white/20"
                        )}>
                            {gameOver ? "Match Complete" : turn === playerColor.charAt(0)
                                ? `⚡ YOUR TURN (${playerColor === 'white' ? 'WHITE' : 'BLACK'} PIECES)`
                                : "⏳ Opponent Thinking..."}
                        </div>
                        {/* Opponent Header (Chess.com Styled) */}
                        <div className="flex items-center justify-between py-2 px-1">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-sm bg-[#5c5c5c] flex items-center justify-center font-bold text-white/50 text-xs">
                                    <span className="opacity-50 grayscale">{PIECES_MAP['k']}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white/90 text-sm">{opponent?.username || (typeof opponent === 'string' ? "Opponent" : "Stockfish")}</span>
                                    <Badge variant="outline" className="h-4 px-1 text-[9px] border-white/10 text-white/40 font-mono">
                                        {opponent?.elo || '1200'}
                                    </Badge>
                                    <div className="flex gap-0.5 opacity-50 scale-75 transform origin-left">
                                        {capturedPieces[orientation === 'white' ? 'w' : 'b'].map((p, i) => (
                                            <span key={i} className="text-[12px] grayscale">{PIECES_MAP[p] || p}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className={cn(
                                "font-mono text-lg font-bold px-3 py-1 rounded bg-[#262421] transition-all duration-300",
                                turn !== playerColor.charAt(0) ? "text-white" : "text-white/30"
                            )}>
                                {formatTime(orientation === 'white' ? blackTime : whiteTime)}
                            </div>
                        </div>

                        {/* The Board container */}
                        <div className="relative group max-w-[520px] mx-auto w-full aspect-square">
                            <div className="absolute -inset-8 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-3xl -z-10 rounded-full" />

                            <div className="relative rounded-2xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border-8 border-white/5 bg-[#1a1c21] h-full w-full z-10">
                                <Chessboard
                                    id="NexusBoard"
                                    position={fen}
                                    onPieceDrop={onPieceDrop}
                                    onSquareClick={onSquareClick}
                                    onSquareRightClick={onSquareRightClick}
                                    onMouseOverSquare={onMouseOverSquare}
                                    onMouseOutSquare={onMouseOutSquare}
                                    boardOrientation={orientation}
                                    showBoardCode={true}
                                    customDarkSquareStyle={{ backgroundColor: "#779556" }}
                                    customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
                                    autoPromoteToQueen={true}
                                    customSquareStyles={{
                                        ...getCheckSquare(),
                                        ...rightClickedSquares,
                                        ...hintSquares,
                                        ...lastMoveSquares,
                                        ...optionSquares,
                                    }}
                                    animationDuration={300}
                                    arePiecesDraggable={!gameOver && !gameStarting}
                                    customBoardStyle={{
                                        borderRadius: '4px',
                                        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)'
                                    }}
                                />
                            </div>

                            {/* Game Start Overlay */}
                            {gameStarting && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                                    <div className="bg-indigo-600/20 backdrop-blur-sm px-12 py-6 rounded-3xl border border-indigo-400/50 animate-in zoom-in-50 fade-in duration-300">
                                        <h2 className="text-6xl font-black text-white italic tracking-tighter drop-shadow-[0_0_30px_rgba(99,102,241,0.8)] animate-pulse">
                                            {startMessage}
                                        </h2>
                                        <div className="h-1.5 w-full bg-white/10 mt-6 overflow-hidden rounded-full border border-white/5">
                                            <div className="h-full bg-indigo-500 animate-progress origin-left" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {gameOver && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
                                    <div className="text-center p-8 space-y-6">
                                        <Trophy className={`w-16 h-16 mx-auto ${gameOver.winner === orientation ? 'text-emerald-400' : 'text-rose-400'}`} />
                                        <div>
                                            <h2 className="text-4xl font-black text-white uppercase mb-2">
                                                {gameOver.winner === orientation ? 'Victory' : gameOver.winner === 'draw' ? 'Draw' : 'Defeat'}
                                            </h2>
                                            <p className="text-white/50 font-medium">by {gameOver.reason}</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <Button onClick={() => setView('lobby')} className="bg-white text-black hover:bg-white/90 font-bold">
                                                Return to Lobby
                                            </Button>
                                            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                                Analyze Game
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Player Header */}
                        <Card className="bg-white/5 border-white/5 p-4 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white">
                                    {user?.username?.[0] || 'You'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{user?.username || 'You'}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Badge variant="outline" className="text-[10px] border-white/10 text-white/50">{user?.elo || '1200'} ELO</Badge>
                                        <div className="flex gap-0.5 ml-2">
                                            {capturedPieces[orientation === 'white' ? 'b' : 'w'].map((p, i) => (
                                                <span key={i} className="text-[14px] leading-none opacity-40 grayscale">{PIECES_MAP[p] || p}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={cn(
                                    "font-mono text-2xl font-bold px-4 py-2 rounded-lg border transition-all duration-300",
                                    turn === orientation.charAt(0)
                                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                                        : "bg-black/40 border-white/5 text-white/40"
                                )}>
                                    {formatTime(orientation === 'white' ? whiteTime : blackTime)}
                                </div>
                            </div>
                        </Card>
                        <div className="h-4" /> {/* Spacer to ensure bottom content is visible */}
                    </div>

                    {/* Side Panel */}
                    <div className="lg:w-80 space-y-4 h-full flex flex-col min-h-[500px]">
                        <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-2xl flex-1 flex flex-col overflow-hidden">
                            <CardHeader className="border-b border-white/5 py-3">
                                <CardTitle className="text-xs font-bold text-white uppercase tracking-[0.2em] opacity-50 flex justify-between items-center">
                                    LIVE MOVE HISTORY
                                    <Badge variant="outline" className="text-[9px] border-white/5 text-white/30 font-mono">
                                        {moveHistory.length} PLY
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <div id="move-history-container" className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
                                <div className="text-[10px] text-white/20 text-center uppercase tracking-[0.3em] my-4 py-2 border-y border-white/5">
                                    MATCH INITIALIZED
                                </div>

                                {/* Move History Table */}
                                <div className="grid grid-cols-[30px_1fr_1fr] gap-x-2 gap-y-2 text-sm font-mono">
                                    {moveHistory.reduce((acc, move, index) => {
                                        if (index % 2 === 0) acc.push([move]);
                                        else acc[acc.length - 1].push(move);
                                        return acc;
                                    }, []).map((pair, i) => (
                                        <div key={i} className="contents group">
                                            <div className="text-white/20 text-[10px] flex items-center justify-end pr-2 py-1 font-bold">
                                                {i + 1}
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-2 flex items-center justify-between border border-transparent group-hover:border-indigo-500/30 transition-all">
                                                <span className={pair[0].piece !== 'p' ? 'text-white' : 'text-indigo-300'}>
                                                    {pair[0].san}
                                                </span>
                                                <span className="text-[8px] text-white/10 uppercase font-sans">W</span>
                                            </div>
                                            {pair[1] ? (
                                                <div className="bg-white/5 rounded-lg p-2 flex items-center justify-between border border-transparent group-hover:border-purple-500/30 transition-all">
                                                    <span className={pair[1].piece !== 'p' ? 'text-white' : 'text-purple-300'}>
                                                        {pair[1].san}
                                                    </span>
                                                    <span className="text-[8px] text-white/10 uppercase font-sans">B</span>
                                                </div>
                                            ) : (
                                                <div className="bg-white/[0.02] rounded-lg p-2 border border-dashed border-white/5 animate-pulse" />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {moveHistory.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full opacity-20">
                                        <History className="w-8 h-8 mb-2" />
                                        <p className="text-[10px] uppercase font-bold tracking-widest">Waiting for first move...</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setOrientation(prev => prev === 'white' ? 'black' : 'white')}
                                className="bg-white/5 border-white/10 text-white hover:bg-indigo-500/20"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Flip Board
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setRightClickedSquares({})}
                                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Clear Marks
                            </Button>
                            {gameMode === 'online' && (
                                <Button variant="outline" onClick={syncWithServer} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                                    Sync Board
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => toast.info('Draw offer sent')} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                                Offer Draw
                            </Button>
                            <Button variant="destructive" onClick={resignGame} className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/50 col-span-2 py-6 font-bold uppercase tracking-tighter">
                                <Sword className="w-4 h-4 mr-2" />
                                Terminate Match (Resign)
                            </Button>
                        </div>

                        <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-2xl p-4">
                            <p className="text-xs text-center text-white/30 uppercase tracking-widest">System Status: Optimal</p>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerGameCenter;
