import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Computer, RotateCcw, Trophy } from "lucide-react";
import InteractiveChessBoard from "@/components/game/InteractiveChessBoard";
import { Chess } from 'chess.js';

const QuickPlayPage = () => {
    const [gameKey, setGameKey] = useState(0);
    const [moveHistory, setMoveHistory] = useState([]);
    const [gameOver, setGameOver] = useState(null);

    const resetGame = () => {
        setGameKey(prev => prev + 1);
        setMoveHistory([]);
        setGameOver(null);
    };

    const handleMove = (move, newGame) => {
        setMoveHistory(prev => [...prev, move]);
    };

    const handleGameOver = (result) => {
        setGameOver(result);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black text-white mb-4 uppercase tracking-tight">
                        Quick Play Chess
                    </h1>
                    <p className="text-white/60 text-lg">Play against the computer - Click or drag pieces to move</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Chess Board */}
                    <div className="lg:col-span-2">
                        <Card className="bg-white/5 border-white/10 backdrop-blur-md rounded-3xl overflow-hidden">
                            <CardContent className="p-8">
                                <div className="relative">
                                    {gameOver && (
                                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
                                            <div className="text-center p-8 space-y-6">
                                                <Trophy className={`w-16 h-16 mx-auto ${gameOver.winner === 'white' ? 'text-emerald-400' : 'text-rose-400'}`} />
                                                <div>
                                                    <h2 className="text-4xl font-black text-white uppercase mb-2">
                                                        {gameOver.winner === 'white' ? 'Victory!' : gameOver.winner === 'black' ? 'Defeat!' : 'Draw!'}
                                                    </h2>
                                                    <p className="text-white/50 font-medium">by {gameOver.reason}</p>
                                                </div>
                                                <Button
                                                    onClick={resetGame}
                                                    className="bg-white text-black hover:bg-white/90 font-bold"
                                                >
                                                    <RotateCcw className="w-4 h-4 mr-2" />
                                                    Play Again
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    <InteractiveChessBoard
                                        key={gameKey}
                                        orientation="white"
                                        gameMode="computer"
                                        isActive={!gameOver}
                                        onMakeMove={handleMove}
                                        onGameOver={handleGameOver}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-6">
                        {/* Controls */}
                        <Card className="bg-white/5 border-white/10 backdrop-blur-md rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Computer className="w-5 h-5" />
                                    Game Controls
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    onClick={resetGame}
                                    className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    New Game
                                </Button>
                                <div className="text-xs text-white/40 text-center pt-2">
                                    <p>• Click a piece to see legal moves</p>
                                    <p>• Drag & drop to move</p>
                                    <p>• Right-click to mark squares</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Move History */}
                        <Card className="bg-white/5 border-white/10 backdrop-blur-md rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-white text-sm uppercase tracking-widest">
                                    Move History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-96 overflow-y-auto space-y-1">
                                    {moveHistory.length === 0 ? (
                                        <p className="text-white/30 text-center text-sm py-8">No moves yet</p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-mono text-white/70">
                                            {moveHistory.reduce((acc, move, index) => {
                                                if (index % 2 === 0) {
                                                    acc.push([move]);
                                                } else {
                                                    acc[acc.length - 1].push(move);
                                                }
                                                return acc;
                                            }, []).map((pair, i) => (
                                                <div key={i} className="contents">
                                                    <div className="flex gap-2">
                                                        <span className="text-white/30 w-6 text-right">{i + 1}.</span>
                                                        <span className="text-white">{pair[0].san}</span>
                                                    </div>
                                                    <div className="text-left">
                                                        {pair[1] ? (
                                                            <span className="text-white">{pair[1].san}</span>
                                                        ) : ''}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickPlayPage;
