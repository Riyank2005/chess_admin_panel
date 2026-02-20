import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Play, Computer, History, Zap, User, Sword, Trophy, RefreshCw, RotateCcw, MessageSquare, Send, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useWebSocket } from "@/context/WebSocketContext";
import { useAuth } from "@/context/AuthContext";
import { Chess } from 'chess.js';
import { Chessboard } from "react-chessboard";
import { getBoardStyle } from "@/lib/board-styles";

const PIECES_MAP = {
    'p': '♟',
    'n': '♞',
    'b': '♝',
    'r': '♜',
    'q': '♛',
    'k': '♚'
};

const PlayerGameCenter = () => {
    const navigate = useNavigate();
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

    // Keep refs in sync with state for keyboard handler
    const setViewSynced = (v) => { viewRef.current = v; setView(v); };
    const setGameModeSynced = (m) => { gameModeRef.current = m; setGameMode(m); };
    const setMoveFromSynced = (s) => { moveFromRef.current = s; setMoveFrom(s); };
    const setCursorSynced = (s) => { cursorRef.current = s; setCursorSquare(s); };
    const setOrientationSynced = (o) => { orientationRef.current = typeof o === 'function' ? o(orientationRef.current) : o; setOrientation(typeof o === 'function' ? o(orientationRef.current) : o); };

    // Game State
    const [fen, setFen] = useState('start');
    const [turn, setTurn] = useState('w');
    const [moveHistory, setMoveHistory] = useState([]);
    const [lastMoveSquares, setLastMoveSquares] = useState({});
    const [optionSquares, setOptionSquares] = useState({});
    const [rightClickedSquares, setRightClickedSquares] = useState({});
    const [hintSquares, setHintSquares] = useState({});
    const [playerColor, setPlayerColor] = useState('white');
    const [gameId, setGameId] = useState(null);
    const [orientation, setOrientation] = useState('white');
    const [opponent, setOpponent] = useState(null);
    const [gameOver, setGameOver] = useState(null);
    const [moveFrom, setMoveFrom] = useState('');
    const [moveTo, setMoveTo] = useState(null);
    const [showHint, setShowHint] = useState(false);
    const [activeMatches, setActiveMatches] = useState([]);
    const [hoveredOrigin, setHoveredOrigin] = useState(null);
    const [capturedPieces, setCapturedPieces] = useState({ w: [], b: [] });
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [drawOfferedBy, setDrawOfferedBy] = useState(null); // 'white', 'black', or null
    const [completedGames, setCompletedGames] = useState([]);
    const [customArrows, setCustomArrows] = useState([]);
    const [syncToggle, setSyncToggle] = useState(false); // Used to force board refresh
    const [movePulse, setMovePulse] = useState(false); // UI effect for moves

    // ── Keyboard Cursor State ──────────────────────────────────────────────────
    // cursorSquare: the square the keyboard cursor is on, e.g. 'e2'
    const [cursorSquare, setCursorSquare] = useState(null);
    const [showKeyboardHint, setShowKeyboardHint] = useState(false);

    // Refs so keyboard handler always reads LATEST values (fixes stale closure)
    const cursorRef = useRef(null);
    const moveFromRef = useRef('');
    const viewRef = useRef('lobby');
    const playerColorRef = useRef('white');
    const orientationRef = useRef('white');
    const gameModeRef = useRef(null);
    const gameOverRef = useRef(null);
    const gameStartingRef = useRef(false);
    // Function refs — so the keyboard handler (registered once) always calls the latest version
    const makeMoveRef = useRef(null);
    const getMoveOptionsRef = useRef(null);
    const optionSquaresRef = useRef({});

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

    // ── Square ↔ File/Rank helpers ─────────────────────────────────────────────
    const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const squareToCoords = (sq) => ({ file: FILES.indexOf(sq[0]), rank: parseInt(sq[1]) - 1 });
    const coordsToSquare = (file, rank) => FILES[file] + (rank + 1);

    // Material calculation logic
    const calculateMaterial = (color) => {
        const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
        const myCaptured = capturedPieces[color] || [];
        const oppColor = color === 'w' ? 'b' : 'w';
        const oppCaptured = capturedPieces[oppColor] || [];

        const myScore = myCaptured.reduce((sum, p) => sum + (values[p] || 0), 0);
        const oppScore = oppCaptured.reduce((sum, p) => sum + (values[p] || 0), 0);

        const diff = myScore - oppScore;
        return diff > 0 ? `+${diff}` : (diff < 0 ? diff : "");
    };

    console.log('[RENDER] Current Board FEN:', fen);

    // Atomic Game Update Helper
    const updateGame = (newChessInstance) => {
        // Update the ref source of truth
        gameRef.current = newChessInstance;

        // Update states to trigger UI re-renders
        const newFen = newChessInstance.fen();
        const newTurn = newChessInstance.turn();
        const history = newChessInstance.history({ verbose: true });

        console.log('[SYNC] 🔄 Updating Game State to Position:', newFen);

        setFen(newFen);
        setTurn(newTurn);
        setMoveHistory(history);
        setSyncToggle(prev => !prev);

        // Trigger UI Pulse effect
        setMovePulse(true);
        setTimeout(() => setMovePulse(false), 600);

        // Update last move highlights
        if (history.length > 0) {
            const lastMove = history[history.length - 1];
            setLastMoveSquares({
                [lastMove.from]: { backgroundColor: "rgba(249, 240, 110, 0.4)" },
                [lastMove.to]: { backgroundColor: "rgba(249, 240, 110, 0.4)" }
            });
        } else {
            setLastMoveSquares({});
        }

        // Calculate captured pieces
        const captured = { w: [], b: [] };
        history.forEach(m => {
            if (m.captured) {
                const capturedColor = m.color === 'w' ? 'b' : 'w';
                captured[capturedColor].push(m.captured);
            }
        });
        setCapturedPieces(captured);

        // Check game over
        checkGameOver(newChessInstance);

        // Play sounds
        if (history.length > 0) {
            const lastMove = history[history.length - 1];
            let soundUrl = 'https://images.chesscomfiles.com/chess-themes/sounds/_common/move-self.mp3';
            if (newChessInstance.inCheck()) {
                soundUrl = 'https://images.chesscomfiles.com/chess-themes/sounds/_common/move-check.mp3';
            } else if (lastMove.captured) {
                soundUrl = 'https://images.chesscomfiles.com/chess-themes/sounds/_common/capture.mp3';
            }

            if (user?.settings?.sounds !== false) {
                try {
                    const audio = new Audio(soundUrl);
                    audio.play().catch(() => { });
                } catch (e) { }
            }
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
                const currentTurn = gameRef.current.turn();
                if (currentTurn === 'w') {
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

    // Fetch active and completed games on load
    useEffect(() => {
        const fetchGames = async () => {
            if (!user?._id) return;
            try {
                // Active Games
                const activeRes = await fetch(`/api/games?status=playing&limit=5&participant=${user._id}`);
                if (activeRes.ok) {
                    const data = await activeRes.json();
                    setActiveGames(data.games || []);
                }

                // Completed Games
                const completedRes = await fetch(`/api/games?status=finished&limit=10&participant=${user._id}`);
                if (completedRes.ok) {
                    const data = await completedRes.json();
                    setCompletedGames(data.games || []);
                }
            } catch (e) {
                console.error("Failed to fetch games", e);
            }
        };
        fetchGames();
        // Refresh every 30s
        const interval = setInterval(fetchGames, 30000);
        return () => clearInterval(interval);
    }, [user?._id]);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('match_found', (data) => {
            console.log('Match found!', data);
            setGameId(data.gameId);
            setOrientation(data.color);
            setPlayerColor(data.color);
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
            setMessages([]); // Clear chat on new game
            setDrawOfferedBy(null);
            toast.success(`Match found! You are playing ${data.color}.`);
        });

        socket.on('chat_message', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        socket.on('draw_offered', ({ color }) => {
            setDrawOfferedBy(color);
            if (color !== orientation) {
                toast("Opponent offers a draw", {
                    action: {
                        label: "Accept",
                        onClick: acceptDraw
                    }
                });
            }
        });

        socket.on('draw_rejected', () => {
            setDrawOfferedBy(null);
            toast.info("Draw offer declined.");
        });

        socket.on('game_move', (data) => {
            console.log('[SOCKET] 📦 Real-time move received:', data);

            // Sync with the server's authoritative board state
            if (data.pgn || data.fen) {
                const syncGame = new Chess();
                try {
                    if (data.pgn) {
                        syncGame.loadPgn(data.pgn);
                    } else {
                        syncGame.loadFen(data.fen);
                    }

                    // Only update if it's actually a new position to prevent flickering
                    if (syncGame.fen() !== gameRef.current.fen()) {
                        console.log('[LOCAL] 🔄 Syncing opponent move...');
                        updateGame(syncGame);
                    }
                } catch (e) {
                    console.error('[SOCKET] ❌ Sync error:', e);
                }
            }
        });

        socket.on('game_state', (data) => {
            console.log('[SOCKET] 🛡️ Game state received:', data);
            const syncGame = new Chess();
            if (data.pgn) {
                syncGame.loadPgn(data.pgn);
            } else if (data.fen) {
                syncGame.loadFen(data.fen);
            }
            updateGame(syncGame);
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

        // Ensure we are in the room if we have a gameId
        if (gameId && view === 'playing') {
            console.log('[SOCKET] 🟢 Auto-joining room:', gameId);
            emit('join_game', { gameId, userId: user?._id });
        }

        return () => {
            socket.off('match_found');
            socket.off('game_move');
            socket.off('game_state');
            socket.off('game_over');
            socket.off('matchmaking_joined');
            socket.off('chat_message');
            socket.off('draw_offered');
            socket.off('draw_rejected');
        };
    }, [socket, gameId, orientation, view]);

    // Explicitly join room on ID change (Double layer security)
    useEffect(() => {
        if (socket && gameId && view === 'playing') {
            console.log('[SOCKET] 📣 Explicitly joining game channel:', gameId);
            emit('join_game', { gameId, userId: user?._id });
        }
    }, [socket, gameId, view]);

    // Matchmaking Functions
    const startMatchmaking = () => {
        if (!connected) {
            toast.error("Not connected to server!");
            return;
        }
        emit('join_matchmaking', {
            userId: user._id,
            username: user.username,
            timeControl: user?.settings?.timeControl || '10+0',
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

    // ── Keyboard Navigation System ─────────────────────────────────────────────
    // Keep refs in sync with state so the keyboard handler always reads fresh values
    useEffect(() => { cursorRef.current = cursorSquare; }, [cursorSquare]);
    useEffect(() => { moveFromRef.current = moveFrom; }, [moveFrom]);
    useEffect(() => { viewRef.current = view; }, [view]);
    useEffect(() => { playerColorRef.current = playerColor; }, [playerColor]);
    useEffect(() => { orientationRef.current = orientation; }, [orientation]);
    useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);
    useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
    useEffect(() => { gameStartingRef.current = gameStarting; }, [gameStarting]);
    // Keep function refs up to date (updated every render, so handler always has latest)
    useEffect(() => { makeMoveRef.current = makeMove; });
    useEffect(() => { getMoveOptionsRef.current = getMoveOptions; });

    // Initialize cursor when entering playing view
    useEffect(() => {
        if (view === 'playing' && !gameStarting) {
            const startSq = playerColor === 'white' ? 'e2' : 'e7';
            cursorRef.current = startSq;
            setCursorSquare(startSq);
        } else if (view !== 'playing') {
            cursorRef.current = null;
            setCursorSquare(null);
        }
    }, [view, gameStarting, playerColor]);

    // Single stable keyboard handler — registered ONCE, reads from refs
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only active during playing view
            if (viewRef.current !== 'playing') return;
            // Don't hijack keyboard when typing in chat
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Read all live values from refs (never stale)
            const cursor = cursorRef.current;
            const fromSq = moveFromRef.current;
            const pColor = playerColorRef.current.charAt(0);
            const isFlipped = orientationRef.current === 'black';
            const isMyTurn = gameRef.current?.turn() === pColor;

            // ── F = Flip Board ──
            if (e.key === 'f' || e.key === 'F') {
                const next = orientationRef.current === 'white' ? 'black' : 'white';
                orientationRef.current = next;
                setOrientation(next);
                toast.info(`Board flipped — now showing ${next}`, { id: 'flip', duration: 800 });
                return;
            }

            // ── R = Resign ──
            if ((e.key === 'r' || e.key === 'R') && !gameOverRef.current) {
                resignGame();
                return;
            }

            // ── Escape = Deselect ──
            if (e.key === 'Escape') {
                if (fromSq) {
                    moveFromRef.current = '';
                    setMoveFrom('');
                    setOptionSquares({});
                    setCustomArrows([]);
                    toast.info('Deselected', { id: 'desel', duration: 600 });
                }
                return;
            }

            // ── ? = Toggle keyboard help ──
            if (e.key === '?') {
                setShowKeyboardHint(prev => !prev);
                return;
            }

            // ── Arrow Keys = Move cursor ──
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();

                const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                const current = cursor || (playerColorRef.current === 'white' ? 'e2' : 'e7');
                let file = FILES.indexOf(current[0]);
                let rank = parseInt(current[1]) - 1;

                if (e.key === 'ArrowUp') rank = isFlipped ? rank - 1 : rank + 1;
                if (e.key === 'ArrowDown') rank = isFlipped ? rank + 1 : rank - 1;
                if (e.key === 'ArrowLeft') file = isFlipped ? file + 1 : file - 1;
                if (e.key === 'ArrowRight') file = isFlipped ? file - 1 : file + 1;

                file = Math.max(0, Math.min(7, file));
                rank = Math.max(0, Math.min(7, rank));

                const newSq = FILES[file] + (rank + 1);
                cursorRef.current = newSq;
                setCursorSquare(newSq);

                // Auto-preview moves when cursor lands on own piece (no piece selected yet)
                if (isMyTurn && !fromSq) {
                    const piece = gameRef.current?.get(newSq);
                    if (piece && piece.color === pColor) {
                        getMoveOptionsRef.current?.(newSq);
                    } else {
                        // Only clear if we aren't hovering a valid target of an already active selection
                        // This allows "Sticky Paths"
                        const currentOptions = optionSquaresRef.current || {};
                        if (!currentOptions[newSq]) {
                            setOptionSquares({});
                            setCustomArrows([]);
                        }
                    }
                }
                return;
            }

            // ── Enter / Space = Select piece OR execute move ──
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!cursor || gameOverRef.current || gameStartingRef.current) return;

                if (!isMyTurn) {
                    toast.error(
                        gameModeRef.current === 'computer' ? 'Wait for the engine to move!' : "It's not your turn!",
                        { id: 'not-turn', duration: 1200 }
                    );
                    return;
                }

                if (!fromSq) {
                    // ── Phase 1: SELECT a piece ──
                    const piece = gameRef.current?.get(cursor);
                    if (piece && piece.color === pColor) {
                        moveFromRef.current = cursor;
                        setMoveFrom(cursor);
                        const found = getMoveOptionsRef.current?.(cursor);
                        if (found) {
                            toast.success(
                                `♟ ${cursor.toUpperCase()} selected — navigate with arrows, press Enter to move`,
                                { id: 'kb-select', duration: 2500, position: 'top-center' }
                            );
                        } else {
                            toast.warning('This piece has no legal moves!', { id: 'no-moves' });
                            moveFromRef.current = '';
                            setMoveFrom('');
                            setCustomArrows([]);
                        }
                    } else {
                        // Give a helpful message showing where the cursor actually is
                        const pieceAtCursor = gameRef.current?.get(cursor);
                        if (pieceAtCursor) {
                            toast.error(`That's your opponent's piece on ${cursor.toUpperCase()}!`, { id: 'no-piece', duration: 1500 });
                        } else {
                            toast.info(`${cursor.toUpperCase()} is empty — use ↑↓←→ to navigate to your piece`, { id: 'no-piece', duration: 1500 });
                        }
                    }
                } else {
                    // ── Phase 2: MOVE to cursor square ──
                    if (cursor === fromSq) {
                        // Pressed Enter on same square = deselect
                        moveFromRef.current = '';
                        setMoveFrom('');
                        setOptionSquares({});
                        setCustomArrows([]);
                        return;
                    }

                    const success = makeMoveRef.current?.({ from: fromSq, to: cursor, promotion: 'q' });
                    if (success) {
                        moveFromRef.current = '';
                        setMoveFrom('');
                        setOptionSquares({});
                        setCustomArrows([]);
                        // The toast logic for makeMove is handled within the makeMove function itself.
                        // This call site just needs to know if the move was successful.
                        toast.success(`✓ Moved ${fromSq.toUpperCase()} → ${cursor.toUpperCase()}`, { id: 'kb-move', duration: 1000 });
                    } else {
                        // Maybe they navigated to another own piece — switch selection
                        const piece = gameRef.current?.get(cursor);
                        if (piece && piece.color === pColor) {
                            moveFromRef.current = cursor;
                            setMoveFrom(cursor);
                            getMoveOptionsRef.current?.(cursor);
                            toast.info(`Switched to ${cursor.toUpperCase()}`, { id: 'kb-switch', duration: 1000 });
                        } else {
                            toast.error(`Can't move there! Choose a highlighted square.`, { id: 'kb-invalid', duration: 1200 });
                        }
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ← Empty deps: registered once, reads everything via refs

    // Helper function to get legal moves for a square (ULTRA BRIGHT PURPLE)
    const getMoveOptions = (square) => {
        const moves = gameRef.current.moves({
            square,
            verbose: true,
        });

        if (moves.length === 0) {
            setOptionSquares({});
            setCustomArrows([]);
            return false;
        }

        const newSquares = {};
        const newArrows = [];
        const pColorChar = playerColor.charAt(0); // white -> 'w', black -> 'b'

        // Find the "best" candidate move for the suggestion
        // Priority: 1. Captures, 2. Pawn double moves, 3. Moves towards opponent's side rank
        const recommendedMove = [...moves].sort((a, b) => {
            if (a.captured && !b.captured) return -1;
            if (!a.captured && b.captured) return 1;

            // For Pawns: Prefer the double step if at start
            if (a.piece === 'p' && Math.abs(parseInt(a.to[1]) - parseInt(a.from[1])) === 2) return -1;
            if (b.piece === 'p' && Math.abs(parseInt(b.to[1]) - parseInt(b.from[1])) === 2) return 1;

            const rankA = parseInt(a.to[1]);
            const rankB = parseInt(b.to[1]);
            return pColorChar === 'w' ? rankB - rankA : rankA - rankB;
        })[0];

        // POPUP: This tells the user immediately that paths are found
        toast.info(`PATHS FOUND: ${moves.length} moves available for ${square.toUpperCase()}!`, {
            id: 'path-logic',
            duration: 1500
        });

        moves.forEach((move) => {
            const pieceOnTarget = gameRef.current.get(move.to);
            const isRecommended = recommendedMove && move.to === recommendedMove.to;

            // Add path arrows — Recommended moves are Emerald, others are Purple/Red
            newArrows.push([
                move.from,
                move.to,
                isRecommended ? 'rgba(16, 185, 129, 0.6)' :
                    (pieceOnTarget ? 'rgba(220, 38, 38, 0.4)' : 'rgba(147, 51, 234, 0.4)')
            ]);

            newSquares[move.to] = isRecommended
                ? {
                    // Recommendation: Strong Emerald 
                    backgroundColor: "rgba(16, 185, 129, 0.7)",
                    border: "4px solid #10b981",
                    borderRadius: "4px"
                }
                : pieceOnTarget
                    ? {
                        // Capture: Danger Red
                        backgroundColor: "rgba(220, 38, 38, 0.4)",
                        border: "4px solid #dc2626",
                        borderRadius: "4px"
                    }
                    : {
                        // Normal Move: Indigo Path
                        backgroundColor: "rgba(99, 102, 241, 0.2)",
                        border: "2px solid #6366f1",
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

        console.log(`[DEBUG] Found ${moves.length} paths for ${square}`, newSquares);
        setOptionSquares(newSquares);
        optionSquaresRef.current = newSquares; // CRITICAL: Fix keyboard sticky paths
        setCustomArrows(newArrows);
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
            setCustomArrows([]);
        }
    };

    const onMouseOutSquare = () => {
        // We keep it sticky - clearing is handled by onMouseOverSquare
    };

    // Handle square click for move selection
    const onSquareClick = (square) => {
        if (gameOver || gameStarting) return;

        const currentTurn = gameRef.current.turn();
        const pColor = playerColor.charAt(0);
        const colorName = playerColor === 'white' ? 'WHITE' : 'BLACK';

        console.log(`[USER_INTERACT] Square Clicked: ${square} | Turn: ${currentTurn} | YourColor: ${pColor}`);

        // If it's not the user's turn
        if (currentTurn !== pColor) {
            if (gameMode === 'computer') {
                toast.error("Wait for the engine to move!", { id: 'not-your-turn', duration: 1500 });
            } else {
                toast.error("It's not your turn!", { id: 'not-your-turn', duration: 1500 });
            }
            return;
        }

        // Reset right-clicked squares
        setRightClickedSquares({});

        // Try to get the piece on the clicked square
        const piece = gameRef.current.get(square);

        // EXTRA LOGIC: If clicking a "Path" square while a piece is hovered, move instantly!
        if (!moveFrom && hoveredOrigin && (optionSquares[square] || square === hoveredOrigin)) {
            const fromSq = hoveredOrigin;
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
                    setHoveredOrigin(null);
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
                    toast.success("Piece Selected! Now click a highlighted square.", {
                        id: 'piece-selected',
                        duration: 2000,
                        position: 'top-center'
                    });
                } else {
                    toast.warning("This piece has no moves! Try another.", { id: 'no-moves' });
                    setMoveFrom('');
                }
            } else if (piece) {
                toast.error(`That is not your piece! You play ${colorName}.`, { id: 'wrong-piece' });
            } else {
                toast.info(`Click one of your ${colorName} pieces first.`, { id: 'info' });
            }
            return;
        }

        // CASE 2: Piece already selected, now choose target
        if (square === moveFrom) {
            console.log(`[CLICK] 🔙 Deselected ${square}`);
            setMoveFrom('');
            setOptionSquares({});
            setCustomArrows([]);
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
            setCustomArrows([]);
            setHintSquares({});
            toast.success("Nice move!", { id: 'nice-move', duration: 1000 });
        } else {
            // If they clicked another of their own pieces, switch selection
            if (piece && piece.color === pColor) {
                console.log(`[CLICK] 🔄 Switching selection to ${square}`);
                setMoveFrom(square);
                getMoveOptions(square);
            } else {
                console.log(`[CLICK] ❌ Invalid move target: ${square}`);
                toast.error("You can't move there! Select another piece or click a highlighted square.", { id: 'invalid-move' });
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
            setCustomArrows([]);
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

        console.log(`[MOVE] ♟️ Attempting Move:`, moveDetails);

        if (currentTurn !== pColor) {
            toast.error("Not your turn!");
            return false;
        }

        try {
            // Safer cloning: use FEN for the engine position
            const gameCopy = new Chess(gameRef.current.fen());

            // Try the move
            const result = gameCopy.move(moveDetails);

            if (result) {
                console.log('[MOVE] ✅ Legal Move:', result.san);

                // Update state
                updateGame(gameCopy);

                // Clear UI helpers
                setOptionSquares({});
                setCustomArrows([]);

                // Premium Piece-Specific UI Feedback
                const pieceIcon = PIECES_MAP[result.piece] || '✓';
                const pieceName = {
                    'p': 'PAWN STEP',
                    'n': 'KNIGHT LEAP',
                    'b': 'BISHOP SLIDE',
                    'r': 'ROOK CHARGE',
                    'q': 'QUEEN STRIKE',
                    'k': 'KING MARCH'
                }[result.piece] || 'MOVE';

                toast.success(`${pieceIcon} ${pieceName}: ${result.from.toUpperCase()} → ${result.to.toUpperCase()}`, {
                    id: 'move-success',
                    description: result.captured ? `Captured opponent's piece!` : 'Nicely played.',
                    style: {
                        background: 'rgba(30, 41, 59, 0.95)',
                        color: '#6366f1',
                        border: '1px solid rgba(99, 102, 241, 0.5)',
                        backdropFilter: 'blur(10px)'
                    }
                });

                if (!timerActive) setTimerActive(true);

                if (gameMode === 'online') {
                    console.log('[SOCKET] 📡 Broacasting move to opponent:', result.san);
                    emit('make_move', {
                        gameId,
                        move: result.san,
                        fen: gameCopy.fen(),
                        pgn: gameCopy.pgn(),
                        senderId: user?._id,
                        senderName: user?.username
                    });
                } else if (gameMode === 'computer') {
                    // Trigger engine move after a short delay
                    setTimeout(() => triggerComputerMove(), 600);
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
            // Clone current game via PGN – safest way to preserve all state
            const currentPgn = gameRef.current.pgn();
            const computerChess = new Chess();
            if (currentPgn) computerChess.loadPgn(currentPgn);

            const pColor = playerColor.charAt(0);
            if (computerChess.turn() === pColor) {
                console.log('[AI] ✋ Not my turn (AI is waiting for you)');
                return;
            }

            console.log('[AI] 🧠 Thinking...');
            const moves = computerChess.moves({ verbose: true });

            if (moves.length === 0) {
                console.log('[AI] 🏳️ No moves possible (Checkmate/Stalemate)');
                checkGameOver(computerChess);
                return;
            }

            // Simple random AI (Novice)
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            const result = computerChess.move(randomMove);

            if (result) {
                console.log('[AI] 🤖 Played:', result.san);
                updateGame(computerChess);
            }
        } catch (e) {
            console.error('[AI] ❌ Engine Error:', e);
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

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim() || gameMode !== 'online') return;

        const msg = {
            gameId,
            sender: user.username,
            text: chatInput
        };
        emit('send_chat', msg);
        setChatInput("");
    };

    const offerDraw = () => {
        if (gameMode !== 'online') return;
        emit('offer_draw', { gameId, userId: user._id });
        toast.info("Draw offer sent.");
    };

    const acceptDraw = () => {
        emit('accept_draw', { gameId, userId: user._id });
    };

    const rejectDraw = () => {
        emit('reject_draw', { gameId });
        setDrawOfferedBy(null);
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

                    {/* Completed Games */}
                    <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] overflow-hidden md:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 p-8">
                            <div className="flex items-center gap-3">
                                <Trophy className="w-6 h-6 text-yellow-400" />
                                <CardTitle className="text-xl font-bold text-white uppercase tracking-tight">Match History</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {completedGames.length === 0 ? (
                                <div className="p-16 text-center space-y-6">
                                    <p className="text-white/20 font-bold uppercase tracking-widest text-sm">No completed games found.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {completedGames.map((game) => {
                                        const isWhite = game.white?._id === user._id;
                                        const myColor = isWhite ? 'white' : 'black';
                                        const opponent = isWhite ? game.black : game.white;
                                        const result = game.result; // "1-0", "0-1", "1/2-1/2"

                                        let resultText = "DRAW";
                                        let resultColor = "text-white/50";

                                        if (result === '1-0') {
                                            resultText = myColor === 'white' ? "VICTORY" : "DEFEAT";
                                            resultColor = myColor === 'white' ? "text-emerald-400" : "text-rose-400";
                                        } else if (result === '0-1') {
                                            resultText = myColor === 'black' ? "VICTORY" : "DEFEAT";
                                            resultColor = myColor === 'black' ? "text-emerald-400" : "text-rose-400";
                                        }

                                        return (
                                            <div key={game._id} className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors">
                                                <div className="flex items-center gap-6">
                                                    <div className={`text-sm font-black uppercase tracking-widest ${resultColor}`}>
                                                        {resultText}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold">vs {opponent?.username || 'Unknown'}</span>
                                                        <span className="text-xs text-white/30 font-mono">{new Date(game.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/player/analysis?id=${game._id}`)}
                                                    className="text-white/40 hover:text-white"
                                                >
                                                    ANALYZE
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div >
            )}

            {
                view === 'matchmaking' && (
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
                )
            }

            {
                view === 'playing' && (
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
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold leading-none mb-1">
                                            {opponent?.username || (typeof opponent === 'string' ? "Opponent" : "Stockfish")}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white/40 text-[10px] font-mono">{opponent?.elo || '1200'} ELO</span>
                                            {calculateMaterial(orientation === 'white' ? 'b' : 'w') && (
                                                <Badge className="h-4 px-1 text-[9px] bg-red-500/10 text-red-400 border-red-500/20">
                                                    {calculateMaterial(orientation === 'white' ? 'b' : 'w')}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 overflow-x-auto max-w-[150px] scrollbar-hide">
                                    {capturedPieces[orientation === 'white' ? 'w' : 'b'].map((p, i) => (
                                        <span key={i} className="text-white/30 text-xs drop-shadow-sm">{PIECES_MAP[p]}</span>
                                    ))}
                                </div>
                                <div className={cn(
                                    "font-mono text-lg font-bold px-3 py-1 rounded bg-[#262421] transition-all duration-300",
                                    turn !== playerColor.charAt(0) ? "text-white" : "text-white/30"
                                )}>
                                    {formatTime(orientation === 'white' ? blackTime : whiteTime)}
                                </div>
                            </div>

                            {/* Keyboard Cursor HUD — always visible above board */}
                            {cursorSquare && (
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40">
                                        <span className="text-cyan-400 text-xs font-black uppercase tracking-widest">⌨ Cursor</span>
                                        <span className="text-white font-black text-sm font-mono bg-cyan-500/30 px-2 py-0.5 rounded">
                                            {cursorSquare.toUpperCase()}
                                        </span>
                                        {moveFrom && (
                                            <>
                                                <span className="text-white/30 text-xs">→ moving from</span>
                                                <span className="text-yellow-300 font-black text-sm font-mono bg-yellow-500/20 px-2 py-0.5 rounded">
                                                    {moveFrom.toUpperCase()}
                                                </span>
                                                {Object.keys(optionSquares).find(s => optionSquares[s].backgroundColor?.includes('16, 185, 129')) && (
                                                    <div className="flex items-center gap-1 ml-4 border-l border-white/10 pl-4">
                                                        <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-tighter">Recommended Target:</span>
                                                        <span className="text-white font-black text-xs font-mono bg-emerald-500/30 px-2 py-0.5 rounded">
                                                            {Object.keys(optionSquares).find(s => optionSquares[s].backgroundColor?.includes('16, 185, 129')).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <span className="text-white/20 text-[10px] uppercase tracking-widest">Enter to {moveFrom ? 'move' : 'select'}</span>
                                </div>
                            )}

                            {/* The Board container */}
                            <div className="relative group max-w-[520px] mx-auto w-full aspect-square">
                                <div className="absolute -inset-8 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-3xl -z-10 rounded-full" />

                                <div className={cn(
                                    "relative rounded-2xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border-8 bg-[#1a1c21] h-full w-full z-10",
                                    movePulse ? "scale-[1.01] shadow-[0_0_50px_rgba(99,102,241,0.4)]" : "scale-100",
                                    gameRef.current?.inCheck()
                                        ? "border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.4)] animate-pulse"
                                        : "border-white/5"
                                )}>
                                    {gameRef.current?.inCheck() && (
                                        <div className="absolute inset-0 bg-red-500/10 z-20 pointer-events-none animate-pulse" />
                                    )}
                                    <Chessboard
                                        id="NexusBoard"
                                        key={`${gameId}-${syncToggle}`} // Refresh board when gameId or syncToggle changes
                                        position={fen}
                                        onPieceDrop={onPieceDrop}
                                        onSquareClick={onSquareClick}
                                        onSquareRightClick={onSquareRightClick}
                                        onMouseOverSquare={onMouseOverSquare}
                                        onMouseOutSquare={onMouseOutSquare}
                                        boardOrientation={orientation}
                                        showBoardCode={false}
                                        autoPromoteToQueen={true}
                                        animationDuration={300}
                                        arePiecesDraggable={!gameOver && !gameStarting}
                                        customArrows={customArrows}
                                        customDarkSquareStyle={{ backgroundColor: getBoardStyle(user?.settings?.boardStyle).dark }}
                                        customLightSquareStyle={{ backgroundColor: getBoardStyle(user?.settings?.boardStyle).light }}
                                        customBoardStyle={{
                                            borderRadius: '12px',
                                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(99, 102, 241, 0.2)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                        customSquareStyles={{
                                            ...getCheckSquare(),
                                            ...rightClickedSquares,
                                            ...hintSquares,
                                            ...lastMoveSquares,
                                            ...(cursorSquare ? {
                                                [cursorSquare]: {
                                                    backgroundColor: 'rgba(6,182,212,0.25)',
                                                    border: '3px solid rgb(6,182,212)',
                                                    boxSizing: 'border-box'
                                                }
                                            } : {}),
                                            ...optionSquares, // Option squares win so dots are visible over cursor
                                        }}
                                    />
                                </div>

                                {/* Status Bar Under Board */}
                                <div className="mt-4 flex items-center justify-between px-4 py-2 rounded-xl bg-black/40 border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${turn === 'w' ? 'bg-white shadow-[0_0_10px_white]' : 'bg-zinc-800 border border-white/20'}`} />
                                        <span className="text-[10px] uppercase font-black tracking-tighter text-white/50">
                                            {turn === 'w' ? "White's Turn" : "Black's Turn"}
                                        </span>
                                    </div>
                                    <div className="text-[9px] font-mono text-white/20 truncate max-w-[200px]">
                                        {fen}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] border-indigo-500/20 text-indigo-400">
                                            {moveHistory.length} PLY
                                        </Badge>
                                    </div>
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
                                                <Button
                                                    variant="outline"
                                                    onClick={() => navigate(`/player/analysis?id=${gameId}`)}
                                                    className="border-white/20 text-white hover:bg-white/10"
                                                >
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
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold leading-none mb-1">{user?.username || "You"}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white/40 text-[10px] font-mono">{user?.elo || 1200} ELO</span>
                                            {calculateMaterial(orientation === 'white' ? 'w' : 'b') && (
                                                <Badge className="h-4 px-1 text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                                    {calculateMaterial(orientation === 'white' ? 'w' : 'b')}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 overflow-x-auto max-w-[150px] scrollbar-hide">
                                    {capturedPieces[orientation === 'white' ? 'b' : 'w'].map((p, i) => (
                                        <span key={i} className="text-white/30 text-xs drop-shadow-sm">{PIECES_MAP[p]}</span>
                                    ))}
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

                            {/* Keyboard Shortcut Legend */}
                            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[9px] font-black text-cyan-400/70 uppercase tracking-widest">⌨ Keyboard Controls</span>
                                    <button
                                        onClick={() => setShowKeyboardHint(p => !p)}
                                        className="text-[9px] text-white/20 hover:text-white/50 transition-colors"
                                    >
                                        {showKeyboardHint ? 'hide' : 'show'}
                                    </button>
                                </div>
                                {showKeyboardHint && (
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
                                        {[
                                            { key: '↑ ↓ ← →', desc: 'Move cursor' },
                                            { key: 'Enter / Space', desc: 'Select & Move' },
                                            { key: 'Esc', desc: 'Deselect piece' },
                                            { key: 'F', desc: 'Flip board' },
                                            { key: 'R', desc: 'Resign' },
                                            { key: '?', desc: 'Toggle this help' },
                                        ].map(({ key, desc }) => (
                                            <div key={key} className="flex items-center gap-2">
                                                <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white font-mono text-[9px] whitespace-nowrap">{key}</kbd>
                                                <span className="text-white/30">{desc}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {!showKeyboardHint && (
                                    <p className="text-[9px] text-white/20">
                                        <kbd className="px-1 py-0.5 rounded bg-white/10 border border-white/10 text-white font-mono">↑↓←→</kbd> move cursor &nbsp;
                                        <kbd className="px-1 py-0.5 rounded bg-white/10 border border-white/10 text-white font-mono">Enter</kbd> select/move
                                    </p>
                                )}
                            </div>
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

                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        updateGame(new Chess(gameRef.current.fen()));
                                        toast.success("Board Re-Synchronized!");
                                    }}
                                    className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Fix Board Sync
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setOrientation(prev => prev === 'white' ? 'black' : 'white')}
                                    className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
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
                                {drawOfferedBy && drawOfferedBy !== orientation ? (
                                    <>
                                        <Button onClick={acceptDraw} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/50">
                                            <Check className="w-4 h-4 mr-2" /> Accept Draw
                                        </Button>
                                        <Button onClick={rejectDraw} className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/50">
                                            <X className="w-4 h-4 mr-2" /> Reject
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        onClick={offerDraw}
                                        disabled={!!drawOfferedBy}
                                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                                    >
                                        {drawOfferedBy === orientation ? "Offer Sent..." : "Offer Draw"}
                                    </Button>
                                )}
                                <Button variant="destructive" onClick={resignGame} className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/50 col-span-2 py-6 font-bold uppercase tracking-tighter">
                                    <Sword className="w-4 h-4 mr-2" />
                                    Terminate Match (Resign)
                                </Button>
                            </div>

                            {/* Chat Section */}
                            <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-2xl flex flex-col overflow-hidden min-h-[250px] flex-1">
                                <div className="p-3 border-b border-white/5 text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2 bg-white/[0.02]">
                                    <MessageSquare className="w-3 h-3" /> Secure Comms
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
                                    {messages.length === 0 && (
                                        <div className="text-center text-white/10 text-[10px] mt-4 uppercase tracking-widest">
                                            No messages yet
                                        </div>
                                    )}
                                    {messages.map((msg, i) => (
                                        <div key={i} className="text-xs break-words">
                                            <span className={`font-bold mr-2 ${msg.sender === user?.username ? 'text-indigo-400' : 'text-emerald-400'}`}>
                                                {msg.sender}:
                                            </span>
                                            <span className="text-white/80">{msg.text}</span>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleSendMessage} className="p-2 border-t border-white/5 flex gap-2 bg-white/[0.02]">
                                    <input
                                        className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:bg-white/10 transition-colors"
                                        placeholder="Type message..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                    />
                                    <button type="submit" className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 p-2 rounded-lg transition-colors">
                                        <Send className="w-3 h-3" />
                                    </button>
                                </form>
                            </Card>

                            <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-2xl p-4">
                                <p className="text-xs text-center text-white/30 uppercase tracking-widest">System Status: Optimal</p>
                            </Card>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default PlayerGameCenter;
