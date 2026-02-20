import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChevronLeft, ChevronRight, Rewind, FastForward,
    Trophy, History, Brain, Zap, Search, Target,
    BookOpen, BarChart2, AlertTriangle, CheckCircle,
    XCircle, Minus, RefreshCw, ArrowLeft, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Chess } from 'chess.js';
import { Chessboard } from "react-chessboard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getBoardStyle } from "@/lib/board-styles";

// ─── Opening Book (ECO codes, top 40 openings) ───────────────────────────────
const OPENING_BOOK = [
    { moves: ['e4', 'e5'], name: "King's Pawn Game", eco: "C20" },
    { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'], name: "Ruy Lopez", eco: "C60" },
    { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'], name: "Italian Game", eco: "C50" },
    { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'], name: "Giuoco Piano", eco: "C54" },
    { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'], name: "Two Knights Defense", eco: "C55" },
    { moves: ['e4', 'e5', 'Nf3', 'Nf6'], name: "Petrov's Defense", eco: "C42" },
    { moves: ['e4', 'e5', 'f4'], name: "King's Gambit", eco: "C30" },
    { moves: ['e4', 'c5'], name: "Sicilian Defense", eco: "B20" },
    { moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'], name: "Sicilian Dragon", eco: "B70" },
    { moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'], name: "Sicilian Najdorf", eco: "B90" },
    { moves: ['e4', 'e6'], name: "French Defense", eco: "C00" },
    { moves: ['e4', 'e6', 'd4', 'd5', 'Nc3'], name: "French: Classical", eco: "C11" },
    { moves: ['e4', 'c6'], name: "Caro-Kann Defense", eco: "B10" },
    { moves: ['e4', 'd5'], name: "Scandinavian Defense", eco: "B01" },
    { moves: ['e4', 'g6'], name: "Modern Defense", eco: "B06" },
    { moves: ['d4', 'd5'], name: "Queen's Pawn Game", eco: "D00" },
    { moves: ['d4', 'd5', 'c4'], name: "Queen's Gambit", eco: "D06" },
    { moves: ['d4', 'd5', 'c4', 'e6'], name: "Queen's Gambit Declined", eco: "D30" },
    { moves: ['d4', 'd5', 'c4', 'dxc4'], name: "Queen's Gambit Accepted", eco: "D20" },
    { moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'], name: "Nimzo-Indian Defense", eco: "E20" },
    { moves: ['d4', 'Nf6', 'c4', 'g6'], name: "King's Indian Defense", eco: "E60" },
    { moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6'], name: "Queen's Indian Defense", eco: "E12" },
    { moves: ['d4', 'f5'], name: "Dutch Defense", eco: "A80" },
    { moves: ['Nf3', 'Nf6', 'c4'], name: "English Opening", eco: "A15" },
    { moves: ['c4'], name: "English Opening", eco: "A10" },
    { moves: ['Nf3'], name: "Réti Opening", eco: "A04" },
    { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'], name: "Scotch Game", eco: "C45" },
    { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3'], name: "Three Knights Game", eco: "C46" },
    { moves: ['d4', 'Nf6', 'c4', 'c5'], name: "Benoni Defense", eco: "A60" },
    { moves: ['e4', 'Nf6'], name: "Alekhine's Defense", eco: "B02" },
];

// ─── Move Classification ──────────────────────────────────────────────────────
const classifyMove = (evalBefore, evalAfter, color) => {
    // Normalize: positive = good for the side that just moved
    const sign = color === 'w' ? 1 : -1;
    const before = sign * evalBefore;
    const after = sign * evalAfter;
    const loss = before - after; // centipawns lost

    if (loss >= 300) return { label: 'Blunder', icon: '??', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/40' };
    if (loss >= 100) return { label: 'Mistake', icon: '?', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40' };
    if (loss >= 50) return { label: 'Inaccuracy', icon: '?!', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40' };
    if (loss <= -50) return { label: 'Brilliant', icon: '!!', color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/40' };
    if (loss <= -20) return { label: 'Good', icon: '!', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40' };
    return { label: 'Best', icon: '✓', color: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10' };
};

// ─── Identify Opening ─────────────────────────────────────────────────────────
const identifyOpening = (history) => {
    const sans = history.map(m => m.san);
    let best = null;
    for (const opening of OPENING_BOOK) {
        const matches = opening.moves.every((m, i) => sans[i] === m);
        if (matches && (!best || opening.moves.length > best.moves.length)) {
            best = opening;
        }
    }
    return best || { name: 'Custom Opening', eco: '—', moves: [] };
};

// ─── Accuracy Calculation ─────────────────────────────────────────────────────
const computeAccuracy = (annotations) => {
    const white = annotations.filter((_, i) => i % 2 === 0);
    const black = annotations.filter((_, i) => i % 2 === 1);

    const score = (moves) => {
        if (!moves.length) return 100;
        const weights = { Blunder: 0, Mistake: 30, Inaccuracy: 70, Good: 90, Brilliant: 100, Best: 100 };
        const total = moves.reduce((s, m) => s + (weights[m.classification?.label] ?? 85), 0);
        return Math.round(total / moves.length);
    };

    return { white: score(white), black: score(black) };
};

// ─── Stockfish API (client-side via public API) ───────────────────────────────
const getStockfishEval = async (fen, depth = 10) => {
    try {
        const res = await fetch(`https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=${depth}`);
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (data.success) {
            const bestmove = data.bestmove?.split(' ')[1] || null;
            const evaluation = data.evaluation ?? (data.mate ? (data.mate > 0 ? 9999 : -9999) : 0);
            return { eval: parseFloat(evaluation) * 100, bestMove: bestmove, mate: data.mate };
        }
    } catch (e) { /* fallback */ }
    return { eval: 0, bestMove: null, mate: null };
};

// ─── Eval Bar ─────────────────────────────────────────────────────────────────
const EvalBar = ({ evaluation, mate }) => {
    const clamp = (v) => Math.max(-1000, Math.min(1000, v));
    const pct = mate
        ? (mate > 0 ? 95 : 5)
        : 50 + (clamp(evaluation) / 1000) * 45;

    const label = mate
        ? `M${Math.abs(mate)}`
        : `${evaluation >= 0 ? '+' : ''}${(evaluation / 100).toFixed(1)}`;

    return (
        <div className="flex flex-col items-center gap-1 w-6">
            <span className="text-[9px] font-mono text-white/40 rotate-180" style={{ writingMode: 'vertical-rl' }}>{label}</span>
            <div className="flex-1 w-full rounded-full overflow-hidden bg-[#1a1a1a] border border-white/10 relative min-h-[300px]">
                <div
                    className="absolute bottom-0 w-full bg-white transition-all duration-500 ease-out"
                    style={{ height: `${pct}%` }}
                />
                <div
                    className="absolute top-0 w-full bg-[#1a1a1a] transition-all duration-500 ease-out"
                    style={{ height: `${100 - pct}%` }}
                />
            </div>
        </div>
    );
};

// ─── Accuracy Ring ────────────────────────────────────────────────────────────
const AccuracyRing = ({ score, label, color }) => {
    const r = 28, circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;
    return (
        <div className="flex flex-col items-center gap-1">
            <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                <circle
                    cx="36" cy="36" r={r} fill="none"
                    stroke={color} strokeWidth="6"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    transform="rotate(-90 36 36)"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                />
                <text x="36" y="40" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{score}%</text>
            </svg>
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{label}</span>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PlayerGameAnalysis = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Game selection
    const [gamesList, setGamesList] = useState([]);
    const [loadingGames, setLoadingGames] = useState(true);
    const [selectedGameId, setSelectedGameId] = useState(null);
    const [gameData, setGameData] = useState(null);
    const [loadingGame, setLoadingGame] = useState(false);
    const [showSelector, setShowSelector] = useState(false);

    // Board state
    const [boardGame, setBoardGame] = useState(new Chess());
    const [orientation, setOrientation] = useState('white');
    const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
    const [history, setHistory] = useState([]);
    const [lastMoveSquares, setLastMoveSquares] = useState({});

    // Analysis state
    const [annotations, setAnnotations] = useState([]); // per-move classification
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [currentEval, setCurrentEval] = useState({ eval: 0, bestMove: null, mate: null });
    const [bestMoveArrow, setBestMoveArrow] = useState([]);
    const [opening, setOpening] = useState(null);
    const [accuracy, setAccuracy] = useState({ white: 0, black: 0 });

    // GRANDMASTER'S EYE FEATURES
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [trainingMode, setTrainingMode] = useState(false);
    const [guessMoveResult, setGuessMoveResult] = useState(null); // 'success' | 'fail' | null
    const [predictionScore, setPredictionScore] = useState(0);

    // Derived: Heatmap Styles
    const heatmapStyles = useMemo(() => {
        if (!showHeatmap) return {};
        const styles = {};
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        for (let f = 0; f < 8; f++) {
            for (let r = 1; r <= 8; r++) {
                const sq = `${files[f]}${r}`;
                try {
                    // Count pieces attacking this square
                    const whiteAttackers = boardGame.attackers(sq, 'w').length;
                    const blackAttackers = boardGame.attackers(sq, 'b').length;
                    const diff = whiteAttackers - blackAttackers;

                    if (diff > 0) {
                        const intensity = Math.min(0.5, diff * 0.12);
                        styles[sq] = { backgroundColor: `rgba(34, 197, 94, ${intensity})` }; // Emerald Green
                    } else if (diff < 0) {
                        const intensity = Math.min(0.5, Math.abs(diff) * 0.12);
                        styles[sq] = { backgroundColor: `rgba(239, 68, 68, ${intensity})` }; // Rose Red
                    }
                } catch (e) { /* silent skip */ }
            }
        }
        return styles;
    }, [boardGame, showHeatmap]);

    // Derived: Storytelling
    const gameStory = useMemo(() => {
        if (annotations.length === 0) return null;

        let narrative = `This battle unfolded through the ${opening?.name || 'an intricate opening'}. `;

        // Find major turning point
        const majorSwing = annotations.find(a => Math.abs(a.evalAfter - a.evalBefore) > 250);
        if (majorSwing) {
            const moveNum = Math.floor(annotations.indexOf(majorSwing) / 2) + 1;
            const side = annotations.indexOf(majorSwing) % 2 === 0 ? 'White' : 'Black';
            const impact = majorSwing.evalAfter - majorSwing.evalBefore > 0 ? "White's favor" : "Black's favor";
            narrative += `The game reached a fever pitch at move ${moveNum}, where a massive swing in evaluation shifted momentum toward ${impact}. `;
        } else {
            narrative += `It was a remarkably consistent game with neither side conceding a major advantage for much of the struggle. `;
        }

        const blunders = annotations.filter(a => a.classification.label === 'Blunder').length;
        if (blunders > 3) {
            narrative += `Complexity led to several critical errors, making it a wild and unpredictable contest. `;
        } else if (blunders === 0 && annotations.length > 20) {
            narrative += `Both players demonstrated exceptional precision, maintaining high-level integrity throughout. `;
        }

        const final = annotations[annotations.length - 1];
        if (final.mate) {
            narrative += `The game reached a definitive conclusion with a clinical checkmate sequence.`;
        } else {
            const margin = Math.abs(final.evalAfter);
            if (margin > 800) narrative += "The endgame was dominated by a crushing tactical advantage.";
            else if (margin < 100) narrative += "The players fought to a deadlocked standstill in the closing moves.";
            else narrative += "Positioning and patience proved decisive in the final phase.";
        }

        return narrative;
    }, [annotations, opening]);

    // ── Fetch games list on mount ──────────────────────────────────────────────
    useEffect(() => {
        const fetchGames = async () => {
            if (!user?._id) return;
            try {
                const res = await fetch(`/api/games?status=finished&limit=20&participant=${user._id}`);
                if (res.ok) {
                    const data = await res.json();
                    setGamesList(data.games || []);
                }
            } catch (e) {
                console.error('Failed to fetch games', e);
            } finally {
                setLoadingGames(false);
            }
        };

        // Check URL param first
        const params = new URLSearchParams(window.location.search);
        const gameId = params.get('id');
        if (gameId) {
            setSelectedGameId(gameId);
        } else {
            setShowSelector(true);
        }

        fetchGames();
    }, [user?._id]);

    // ── Load game when selectedGameId changes ─────────────────────────────────
    useEffect(() => {
        if (!selectedGameId) return;
        loadGame(selectedGameId);
    }, [selectedGameId]);

    const loadGame = async (id) => {
        setLoadingGame(true);
        setAnnotations([]);
        setCurrentMoveIndex(-1);
        setLastMoveSquares({});
        setBestMoveArrow([]);
        setCurrentEval({ eval: 0, bestMove: null, mate: null });

        try {
            const res = await fetch(`/api/games/${id}`);
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            setGameData(data);

            const chess = new Chess();
            if (data.pgn) {
                chess.loadPgn(data.pgn);
            } else if (data.fen) {
                chess.load(data.fen);
            }

            const fullHistory = chess.history({ verbose: true });
            setHistory(fullHistory);

            // Identify opening
            setOpening(identifyOpening(fullHistory));

            // Set orientation based on user
            const isWhite = data.white?._id === user?._id || data.white === user?._id;
            setOrientation(isWhite ? 'white' : 'black');

            // Reset board to start
            setBoardGame(new Chess());
            setCurrentMoveIndex(-1);
            setShowSelector(false);

            toast.success('Game loaded! Click "Analyze" to run full analysis.');
        } catch (e) {
            toast.error('Failed to load game');
        } finally {
            setLoadingGame(false);
        }
    };

    // ── Navigation ─────────────────────────────────────────────────────────────
    const goToMove = useCallback((index) => {
        if (!history.length) return;
        const clampedIndex = Math.max(-1, Math.min(history.length - 1, index));

        const newGame = new Chess();
        for (let i = 0; i <= clampedIndex; i++) {
            newGame.move(history[i]);
        }

        setBoardGame(newGame);
        setCurrentMoveIndex(clampedIndex);
        setGuessMoveResult(null); // Reset training feedback on navigation

        if (clampedIndex >= 0) {
            const move = history[clampedIndex];
            setLastMoveSquares({
                [move.from]: { backgroundColor: 'rgba(249,240,110,0.4)' },
                [move.to]: { backgroundColor: 'rgba(249,240,110,0.4)' },
            });

            // Update eval from annotations if available
            if (annotations[clampedIndex]) {
                const ann = annotations[clampedIndex];
                setCurrentEval({ eval: ann.evalAfter, bestMove: ann.bestMove, mate: ann.mate });
                if (ann.bestMove && ann.bestMove.length >= 4) {
                    const from = ann.bestMove.slice(0, 2);
                    const to = ann.bestMove.slice(2, 4);
                    setBestMoveArrow([[from, to, 'rgb(0,200,100)']]);
                } else {
                    setBestMoveArrow([]);
                }
            }
        } else {
            setLastMoveSquares({});
            setBestMoveArrow([]);
        }
    }, [history, annotations]);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'ArrowLeft') goToMove(currentMoveIndex - 1);
            if (e.key === 'ArrowRight') goToMove(currentMoveIndex + 1);
            if (e.key === 'Home') goToMove(-1);
            if (e.key === 'End') goToMove(history.length - 1);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [currentMoveIndex, history, goToMove]);

    // ── Full Analysis ──────────────────────────────────────────────────────────
    const runAnalysis = async () => {
        if (!history.length) return;
        setAnalyzing(true);
        setAnalysisProgress(0);

        const results = [];
        const chess = new Chess();
        let prevEval = 0;

        for (let i = 0; i < history.length; i++) {
            const move = history[i];
            const fenBefore = chess.fen();
            chess.move(move);
            const fenAfter = chess.fen();

            // Get engine eval for position AFTER the move
            const engineData = await getStockfishEval(fenAfter, 10);
            const evalAfter = engineData.eval;

            const classification = classifyMove(prevEval, evalAfter, move.color);

            results.push({
                move,
                fenBefore,
                fenAfter,
                evalBefore: prevEval,
                evalAfter,
                bestMove: engineData.bestMove,
                mate: engineData.mate,
                classification,
            });

            prevEval = evalAfter;
            setAnalysisProgress(Math.round(((i + 1) / history.length) * 100));

            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 200));
        }

        setAnnotations(results);
        const acc = computeAccuracy(results);
        setAccuracy(acc);
        setAnalyzing(false);
        toast.success('Analysis complete!');
    };

    // ── Computed stats ─────────────────────────────────────────────────────────
    const stats = {
        blunders: { w: 0, b: 0 },
        mistakes: { w: 0, b: 0 },
        inaccuracies: { w: 0, b: 0 },
        brilliant: { w: 0, b: 0 },
    };
    annotations.forEach((a, i) => {
        const side = i % 2 === 0 ? 'w' : 'b';
        if (a.classification?.label === 'Blunder') stats.blunders[side]++;
        if (a.classification?.label === 'Mistake') stats.mistakes[side]++;
        if (a.classification?.label === 'Inaccuracy') stats.inaccuracies[side]++;
        if (a.classification?.label === 'Brilliant') stats.brilliant[side]++;
    });

    const currentAnnotation = currentMoveIndex >= 0 ? annotations[currentMoveIndex] : null;

    // ── Render ─────────────────────────────────────────────────────────────────
    if (loadingGame) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                    <p className="text-white/40 font-black uppercase tracking-widest text-sm">Loading Battle Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-16 animate-in fade-in duration-500">

            {/* ── Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/player/game-center')}
                        className="rounded-xl border-white/10 hover:bg-white/5 h-10 w-10 p-0"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Game Analysis</h1>
                        {gameData && (
                            <p className="text-xs text-white/40 font-mono uppercase tracking-widest mt-0.5">
                                {gameData.white?.username || 'White'} vs {gameData.black?.username || 'Black'}
                                {gameData.createdAt && ` • ${new Date(gameData.createdAt).toLocaleDateString()}`}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowSelector(true)}
                        className="border-white/10 text-white hover:bg-white/5 gap-2"
                    >
                        <Search className="w-4 h-4" /> Select Game
                    </Button>
                    {gameData && !analyzing && (
                        <Button
                            onClick={runAnalysis}
                            className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold gap-2"
                        >
                            <Brain className="w-4 h-4" />
                            {annotations.length ? 'Re-Analyze' : 'Analyze Game'}
                        </Button>
                    )}
                    {analyzing && (
                        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                            <span className="text-indigo-300 text-sm font-bold">{analysisProgress}%</span>
                            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-300"
                                    style={{ width: `${analysisProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Game Selector Modal ── */}
            {showSelector && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => gameData && setShowSelector(false)}>
                    <div className="bg-[#0f1117] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Search className="w-5 h-5 text-indigo-400" />
                                <h2 className="text-lg font-black text-white uppercase tracking-tight">Select a Game</h2>
                            </div>
                            {gameData && (
                                <Button variant="ghost" size="sm" onClick={() => setShowSelector(false)} className="text-white/40 hover:text-white">✕</Button>
                            )}
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2 scrollbar-hide">
                            {loadingGames ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                                </div>
                            ) : gamesList.length === 0 ? (
                                <div className="text-center py-12 text-white/30 text-sm uppercase tracking-widest font-bold">
                                    No completed games found
                                </div>
                            ) : (
                                gamesList.map((g) => {
                                    const isWhite = g.white?._id === user?._id;
                                    const opp = isWhite ? g.black : g.white;
                                    const myColor = isWhite ? 'white' : 'black';
                                    let resultText = 'Draw';
                                    let resultColor = 'text-white/40';
                                    if (g.result === '1-0') { resultText = isWhite ? 'Win' : 'Loss'; resultColor = isWhite ? 'text-emerald-400' : 'text-rose-400'; }
                                    if (g.result === '0-1') { resultText = !isWhite ? 'Win' : 'Loss'; resultColor = !isWhite ? 'text-emerald-400' : 'text-rose-400'; }

                                    return (
                                        <button
                                            key={g._id}
                                            onClick={() => { setSelectedGameId(g._id); }}
                                            className={cn(
                                                "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                                                selectedGameId === g._id
                                                    ? "bg-indigo-500/20 border-indigo-500/50"
                                                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-2 h-2 rounded-full", myColor === 'white' ? 'bg-white' : 'bg-gray-600')} />
                                                <div>
                                                    <p className="text-sm font-bold text-white">vs {opp?.username || 'Unknown'}</p>
                                                    <p className="text-[10px] text-white/30 font-mono">{new Date(g.createdAt).toLocaleDateString()} • {g.timeControl || '10+0'}</p>
                                                </div>
                                            </div>
                                            <span className={cn("text-xs font-black uppercase tracking-widest", resultColor)}>{resultText}</span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!gameData && !loadingGame && (
                <div className="flex flex-col items-center justify-center h-[50vh] gap-6">
                    <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center">
                        <Brain className="w-12 h-12 text-white/20" />
                    </div>
                    <div className="text-center">
                        <p className="text-white/30 font-bold uppercase tracking-widest text-sm mb-2">No game selected</p>
                        <p className="text-white/15 text-xs uppercase tracking-tighter">Click "Select Game" to begin analysis</p>
                    </div>
                    <Button onClick={() => setShowSelector(true)} className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold gap-2">
                        <Search className="w-4 h-4" /> Browse Games
                    </Button>
                </div>
            )}

            {gameData && (
                <>
                    {/* ── Opening + Accuracy Row ── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Opening */}
                        <Card className="bg-white/5 border-white/5 rounded-2xl p-5 md:col-span-2">
                            <div className="flex items-center gap-3 mb-1">
                                <BookOpen className="w-4 h-4 text-amber-400" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Opening Identified</span>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 font-mono text-xs px-3 py-1">
                                    {opening?.eco || '—'}
                                </Badge>
                                <span className="text-white font-bold text-lg">{opening?.name || 'Custom Opening'}</span>
                            </div>
                            {opening?.moves?.length > 0 && (
                                <p className="text-white/30 text-xs font-mono mt-2 tracking-wide">
                                    {opening.moves.join(' · ')}
                                </p>
                            )}
                        </Card>

                        {/* Result */}
                        <Card className="bg-white/5 border-white/5 rounded-2xl p-5 flex items-center gap-4">
                            <Trophy className={cn("w-8 h-8", gameData.result === '1-0' ? 'text-white' : gameData.result === '0-1' ? 'text-gray-500' : 'text-yellow-400')} />
                            <div>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Result</p>
                                <p className="text-2xl font-black text-white">{gameData.result || '—'}</p>
                                <p className="text-xs text-white/30 font-mono capitalize">{gameData.status}</p>
                            </div>
                        </Card>
                    </div>

                    {/* ── Grandmaster's Eye: Storytelling ── */}
                    {gameStory && (
                        <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 border-white/5 rounded-3xl p-6 shadow-2xl my-6">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                                    <Brain className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">The Story of the Game</h3>
                                        <h2 className="text-xl font-black text-white tracking-tight uppercase mt-1">NEXUS AI INSIGHT</h2>
                                    </div>
                                    <p className="text-white/70 text-sm leading-relaxed italic font-medium max-w-4xl">
                                        "{gameStory}"
                                    </p>
                                    <div className="flex items-center gap-4 pt-2">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full border-2 border-[#09090b] bg-white/5 flex items-center justify-center">
                                                    <div className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Processing Tactical Patterns...</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* ── Main Board + Side Panel ── */}
                    <div className="flex flex-col lg:flex-row gap-6">

                        {/* Eval Bar + Board */}
                        <div className="flex gap-3 flex-1">
                            <EvalBar evaluation={currentEval.eval} mate={currentEval.mate} />

                            <div className="flex-1 space-y-3">
                                {/* Current move annotation banner */}
                                {currentAnnotation && (
                                    <div className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all",
                                        currentAnnotation.classification.bg,
                                        currentAnnotation.classification.border,
                                        currentAnnotation.classification.color
                                    )}>
                                        <span className="text-lg font-black">{currentAnnotation.classification.icon}</span>
                                        <span>{currentAnnotation.classification.label}</span>
                                        <span className="text-white/30 font-mono text-xs ml-auto">
                                            {currentAnnotation.evalAfter >= 0 ? '+' : ''}{(currentAnnotation.evalAfter / 100).toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                {/* Heatmap Toggle & Training Mode */}
                                <div className="flex items-center justify-between gap-4 px-2">
                                    <div className="flex gap-2">
                                        <Button
                                            variant={showHeatmap ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setShowHeatmap(!showHeatmap)}
                                            className={cn("h-8 rounded-lg text-[10px] font-black uppercase tracking-widest", showHeatmap ? "bg-emerald-500 hover:bg-emerald-400" : "border-white/10")}
                                        >
                                            <Zap className="w-3 h-3 mr-1.5" />
                                            {showHeatmap ? "Control Grid: ON" : "Control Grid"}
                                        </Button>
                                        <Button
                                            variant={trainingMode ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => {
                                                setTrainingMode(!trainingMode);
                                                setGuessMoveResult(null);
                                            }}
                                            className={cn("h-8 rounded-lg text-[10px] font-black uppercase tracking-widest", trainingMode ? "bg-indigo-500 hover:bg-indigo-400" : "border-white/10")}
                                        >
                                            <Target className="w-3 h-3 mr-1.5" />
                                            {trainingMode ? "Training Active" : "Prediction Mode"}
                                        </Button>
                                    </div>
                                    {trainingMode && (
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-white/10 hover:bg-white/10 text-white/60 font-mono text-[10px] h-7">
                                                SCORE: {predictionScore}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                {/* Board */}
                                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/5 bg-[#1a1c21] aspect-square max-w-[520px] mx-auto w-full group">
                                    <Chessboard
                                        id="AnalysisBoard"
                                        position={boardGame.fen()}
                                        boardOrientation={orientation}
                                        onPieceDrop={(source, target) => {
                                            if (!trainingMode) return false;

                                            const nextMove = history[currentMoveIndex + 1];
                                            if (!nextMove) return false;

                                            if (source === nextMove.from && target === nextMove.to) {
                                                setGuessMoveResult('success');
                                                setPredictionScore(s => s + 10);
                                                toast.success("Brilliant! You matched the play.");
                                                setTimeout(() => {
                                                    goToMove(currentMoveIndex + 1);
                                                    setGuessMoveResult(null);
                                                }, 1000);
                                                return true;
                                            } else {
                                                setGuessMoveResult('fail');
                                                toast.error("Not quite. That wasn't the move played.");
                                                return false;
                                            }
                                        }}
                                        arePiecesDraggable={trainingMode}
                                        customDarkSquareStyle={{ backgroundColor: getBoardStyle(user?.settings?.boardStyle).dark }}
                                        customLightSquareStyle={{ backgroundColor: getBoardStyle(user?.settings?.boardStyle).light }}
                                        customSquareStyles={{
                                            ...lastMoveSquares,
                                            ...heatmapStyles,
                                            ...(guessMoveResult === 'success' ? { [history[currentMoveIndex + 1]?.to]: { backgroundColor: 'rgba(34,197,94,0.6)' } } : {}),
                                            ...(guessMoveResult === 'fail' ? { [history[currentMoveIndex + 1]?.from]: { backgroundColor: 'rgba(239,68,68,0.4)' } } : {}),
                                        }}
                                        customArrows={trainingMode ? [] : bestMoveArrow}
                                        customBoardStyle={{ borderRadius: '4px' }}
                                        animationDuration={200}
                                    />

                                    {/* Training Overlay */}
                                    {trainingMode && !guessMoveResult && currentMoveIndex < history.length - 1 && (
                                        <div className="absolute top-4 left-4 right-4 p-3 bg-indigo-500/90 backdrop-blur rounded-xl border border-white/20 shadow-xl pointer-events-none animate-in slide-in-from-top duration-300">
                                            <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-1">Move Prediction Active</p>
                                            <p className="text-white font-bold text-sm">Guess the next move played by {currentMoveIndex % 2 === 0 ? 'Black' : 'White'}...</p>
                                        </div>
                                    )}
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-center gap-2 p-2 rounded-2xl bg-black/40 backdrop-blur border border-white/5">
                                    <Button variant="ghost" size="icon" onClick={() => goToMove(-1)} disabled={currentMoveIndex < 0} className="text-white/40 hover:text-white">
                                        <Rewind className="w-5 h-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => goToMove(currentMoveIndex - 1)} disabled={currentMoveIndex < 0} className="text-white/40 hover:text-white">
                                        <ChevronLeft className="w-6 h-6" />
                                    </Button>
                                    <div className="px-4 text-xs text-white/30 font-mono">
                                        {currentMoveIndex < 0 ? 'Start' : `Move ${currentMoveIndex + 1} / ${history.length}`}
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => goToMove(currentMoveIndex + 1)} disabled={currentMoveIndex >= history.length - 1} className="text-white/40 hover:text-white">
                                        <ChevronRight className="w-6 h-6" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => goToMove(history.length - 1)} disabled={currentMoveIndex >= history.length - 1} className="text-white/40 hover:text-white">
                                        <FastForward className="w-5 h-5" />
                                    </Button>
                                    <div className="w-px h-6 bg-white/10 mx-1" />
                                    <Button variant="ghost" size="icon" onClick={() => setOrientation(o => o === 'white' ? 'black' : 'white')} className="text-white/40 hover:text-white">
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-center text-[10px] text-white/20 uppercase tracking-widest">← → Arrow keys to navigate</p>
                            </div>
                        </div>

                        {/* Side Panel */}
                        <div className="lg:w-80 space-y-4 flex flex-col">

                            {/* Accuracy */}
                            {annotations.length > 0 && (
                                <Card className="bg-white/5 border-white/5 rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <BarChart2 className="w-4 h-4 text-indigo-400" />
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Accuracy Score</span>
                                    </div>
                                    <div className="flex justify-around">
                                        <AccuracyRing score={accuracy.white} label={gameData.white?.username?.slice(0, 8) || 'White'} color="#818cf8" />
                                        <AccuracyRing score={accuracy.black} label={gameData.black?.username?.slice(0, 8) || 'Black'} color="#a78bfa" />
                                    </div>
                                    {/* Stats grid */}
                                    <div className="mt-4 grid grid-cols-3 gap-1 text-center text-[10px]">
                                        <div className="text-white/30 font-bold uppercase tracking-widest col-start-2">White</div>
                                        <div className="text-white/30 font-bold uppercase tracking-widest">Black</div>
                                        {[
                                            { label: '!! Brilliant', key: 'brilliant', color: 'text-cyan-400' },
                                            { label: '?? Blunders', key: 'blunders', color: 'text-rose-400' },
                                            { label: '? Mistakes', key: 'mistakes', color: 'text-orange-400' },
                                            { label: '?! Inaccuracies', key: 'inaccuracies', color: 'text-yellow-400' },
                                        ].map(({ label, key, color }) => (
                                            <>
                                                <div key={`l-${key}`} className="text-white/30 text-left pl-1 py-1 border-t border-white/5 flex items-center">{label}</div>
                                                <div key={`w-${key}`} className={cn("font-black py-1 border-t border-white/5", color)}>{stats[key].w}</div>
                                                <div key={`b-${key}`} className={cn("font-black py-1 border-t border-white/5", color)}>{stats[key].b}</div>
                                            </>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Best Move Suggestion */}
                            {currentAnnotation?.bestMove && (
                                <Card className="bg-emerald-500/10 border-emerald-500/20 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-4 h-4 text-emerald-400" />
                                        <span className="text-[10px] font-black text-emerald-400/70 uppercase tracking-widest">Best Move</span>
                                    </div>
                                    <p className="text-emerald-300 font-black text-xl font-mono">{currentAnnotation.bestMove}</p>
                                    <p className="text-emerald-400/50 text-[10px] mt-1">Green arrow shown on board</p>
                                </Card>
                            )}

                            {/* Move History */}
                            <Card className="bg-white/5 border-white/5 rounded-2xl flex-1 flex flex-col overflow-hidden min-h-[300px]">
                                <CardHeader className="border-b border-white/5 py-3 px-4">
                                    <CardTitle className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                        <History className="w-3 h-3" /> Move List
                                    </CardTitle>
                                </CardHeader>
                                <div className="flex-1 overflow-y-auto scrollbar-hide p-2">
                                    <div className="grid grid-cols-[28px_1fr_1fr] gap-x-1 gap-y-0.5 text-xs font-mono">
                                        {history.reduce((acc, move, index) => {
                                            if (index % 2 === 0) acc.push([move]);
                                            else acc[acc.length - 1].push(move);
                                            return acc;
                                        }, []).map((pair, i) => {
                                            const wIdx = i * 2;
                                            const bIdx = i * 2 + 1;
                                            const wAnn = annotations[wIdx];
                                            const bAnn = annotations[bIdx];

                                            return (
                                                <div key={i} className="contents">
                                                    <div className="text-white/20 text-[9px] flex items-center justify-end pr-1 py-1 font-bold">{i + 1}.</div>

                                                    {/* White move */}
                                                    <button
                                                        onClick={() => goToMove(wIdx)}
                                                        className={cn(
                                                            "flex items-center justify-between px-2 py-1 rounded-lg transition-all text-left",
                                                            currentMoveIndex === wIdx
                                                                ? "bg-indigo-500/30 text-indigo-200 font-bold"
                                                                : "hover:bg-white/10 text-white"
                                                        )}
                                                    >
                                                        <span>{pair[0].san}</span>
                                                        {wAnn && <span className={cn("text-[9px] font-black ml-1", wAnn.classification.color)}>{wAnn.classification.icon}</span>}
                                                    </button>

                                                    {/* Black move */}
                                                    {pair[1] ? (
                                                        <button
                                                            onClick={() => goToMove(bIdx)}
                                                            className={cn(
                                                                "flex items-center justify-between px-2 py-1 rounded-lg transition-all text-left",
                                                                currentMoveIndex === bIdx
                                                                    ? "bg-indigo-500/30 text-indigo-200 font-bold"
                                                                    : "hover:bg-white/10 text-white"
                                                            )}
                                                        >
                                                            <span>{pair[1].san}</span>
                                                            {bAnn && <span className={cn("text-[9px] font-black ml-1", bAnn.classification.color)}>{bAnn.classification.icon}</span>}
                                                        </button>
                                                    ) : (
                                                        <div />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {history.length === 0 && (
                                        <div className="flex items-center justify-center h-full text-white/20 text-[10px] uppercase tracking-widest font-bold py-8">
                                            No moves recorded
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* ── Mistake Detection Timeline ── */}
                    {annotations.length > 0 && (
                        <Card className="bg-white/5 border-white/5 rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-white/5 p-5">
                                <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                                    Mistake Detection Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                {/* Eval graph */}
                                <div className="relative h-24 mb-4 bg-black/20 rounded-xl overflow-hidden border border-white/5">
                                    <svg width="100%" height="100%" viewBox={`0 0 ${annotations.length} 100`} preserveAspectRatio="none">
                                        {/* Zero line */}
                                        <line x1="0" y1="50" x2={annotations.length} y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                                        {/* Eval path */}
                                        <polyline
                                            points={annotations.map((a, i) => {
                                                const y = 50 - Math.max(-45, Math.min(45, a.evalAfter / 100 * 4.5));
                                                return `${i + 0.5},${y}`;
                                            }).join(' ')}
                                            fill="none"
                                            stroke="#818cf8"
                                            strokeWidth="1.5"
                                            strokeLinejoin="round"
                                        />
                                        {/* Mistake markers */}
                                        {annotations.map((a, i) => {
                                            if (!['Blunder', 'Mistake'].includes(a.classification?.label)) return null;
                                            const y = 50 - Math.max(-45, Math.min(45, a.evalAfter / 100 * 4.5));
                                            const color = a.classification.label === 'Blunder' ? '#f87171' : '#fb923c';
                                            return <circle key={i} cx={i + 0.5} cy={y} r="1.5" fill={color} />;
                                        })}
                                    </svg>
                                </div>

                                {/* Critical moments */}
                                <div className="space-y-2">
                                    {annotations
                                        .filter(a => ['Blunder', 'Mistake'].includes(a.classification?.label))
                                        .slice(0, 6)
                                        .map((a, i) => {
                                            const moveNum = Math.floor(annotations.indexOf(a) / 2) + 1;
                                            const side = annotations.indexOf(a) % 2 === 0 ? 'White' : 'Black';
                                            const idx = annotations.indexOf(a);
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => goToMove(idx)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                                        a.classification.bg, a.classification.border,
                                                        "hover:opacity-80"
                                                    )}
                                                >
                                                    <span className={cn("text-lg font-black", a.classification.color)}>{a.classification.icon}</span>
                                                    <div className="flex-1">
                                                        <span className={cn("text-sm font-bold", a.classification.color)}>
                                                            {a.classification.label}
                                                        </span>
                                                        <span className="text-white/40 text-xs ml-2">
                                                            Move {moveNum} ({side}) — {a.move.san}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] text-white/30 font-mono">
                                                            {a.evalBefore >= 0 ? '+' : ''}{(a.evalBefore / 100).toFixed(1)} →{' '}
                                                            {a.evalAfter >= 0 ? '+' : ''}{(a.evalAfter / 100).toFixed(1)}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    {annotations.filter(a => ['Blunder', 'Mistake'].includes(a.classification?.label)).length === 0 && (
                                        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                                            <span className="text-emerald-300 font-bold text-sm">No blunders or mistakes detected! Excellent play.</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Prompt to analyze ── */}
                    {annotations.length === 0 && !analyzing && (
                        <Card className="bg-indigo-500/10 border-indigo-500/20 rounded-2xl p-8 text-center">
                            <Brain className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                            <h3 className="text-white font-black text-lg mb-2">Ready to Analyze</h3>
                            <p className="text-white/40 text-sm mb-4">
                                Click <strong className="text-indigo-300">Analyze Game</strong> to run full engine analysis —
                                mistake detection, best moves, accuracy scores, and more.
                            </p>
                            <Button onClick={runAnalysis} className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold gap-2 mx-auto">
                                <Zap className="w-4 h-4" /> Run Analysis
                            </Button>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
};

export default PlayerGameAnalysis;
