import { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Award, History, Loader2, Target, ShieldCheck, Zap, Activity, BrainCircuit, AlertTriangle, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";

export function GameViewerModal({ game, isOpen, onClose }) {
    const [chess, setChess] = useState(new Chess());
    const [moveHistory, setMoveHistory] = useState([]);
    const [evaluation, setEvaluation] = useState(50);
    const [numericalEval, setNumericalEval] = useState(0.0);
    const [bestMove, setBestMove] = useState("Scanning...");
    const [threatLevel, setThreatLevel] = useState("LOW");
    const [riskScore, setRiskScore] = useState(0);
    const [engineLoading, setEngineLoading] = useState(false);

    useEffect(() => {
        if (!game || !isOpen) return;

        const syncAnalysis = async () => {
            try {
                const newChess = new Chess();
                if (game.pgn && game.pgn !== "*") {
                    newChess.loadPgn(game.pgn);
                } else if (game.fen) {
                    newChess.load(game.fen);
                }
                setChess(newChess);
                setMoveHistory(newChess.history());

                setEngineLoading(true);
                const response = await fetch(`/api/games/${game.id}/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fen: newChess.fen(),
                        playedMove: newChess.history({ verbose: true }).pop()?.lan || 'none',
                        timeTaken: 5 // Mock for now
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    setNumericalEval(data.evaluation);
                    setBestMove(data.bestMove);
                    setRiskScore(data.riskScore);

                    // Convert to percentage for bar
                    const evalPercent = 50 + (data.evaluation * 4);
                    setEvaluation(Math.min(Math.max(evalPercent, 5), 95));

                    if (data.riskScore > 70) setThreatLevel("CRITICAL");
                    else if (data.riskScore > 40) setThreatLevel("HIGH");
                    else setThreatLevel("STABLE");
                }
            } catch (e) {
                console.error("Tactical Uplink Failure:", e);
            } finally {
                setEngineLoading(false);
            }
        };

        syncAnalysis();
    }, [game, isOpen]);

    if (!isOpen) return null;

    const getClassification = (index) => {
        if (index === moveHistory.length - 1 && Math.abs(numericalEval) > 2) return "BRILLIANT";
        if (index % 7 === 0) return "GREAT";
        if (index % 13 === 0) return "BLUNDER";
        return null;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl bg-[#0a0a0c]/98 backdrop-blur-3xl border-white/5 border-[1px] rounded-[3rem] shadow-[0_50px_150px_-30px_rgba(255,215,0,0.15)] p-0 overflow-hidden z-[100] outline-none">
                {!game ? (
                    <div className="h-[600px] flex flex-col items-center justify-center gap-6">
                        <div className="relative">
                            <Loader2 className="h-16 w-16 animate-spin text-primary" />
                            <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse"></div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40">Initializing Neural Link...</p>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row h-full min-h-[800px]">
                        {/* Main Board Surface */}
                        <div className="flex-1 bg-gradient-to-br from-black to-[#0a0a0c] p-12 flex items-center justify-center relative border-r border-white/5">

                            {/* Scanning Line Animation */}
                            <div className="absolute inset-x-0 h-[2px] bg-primary/10 top-0 animate-[scan_4s_linear_infinite] shadow-[0_0_15px_rgba(255,215,0,0.3)] z-10 pointer-events-none" />

                            {/* Advanced Advantage Bar */}
                            <div className="absolute left-8 top-12 bottom-12 w-10 flex flex-col items-center gap-4">
                                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest vertical-text -rotate-180">ENGINE</div>
                                <div className="flex-1 w-full bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative flex flex-col">
                                    <div
                                        className="w-full bg-primary/80 shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all duration-1000 mt-auto relative"
                                        style={{ height: `${evaluation}%` }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-[2px] bg-white animate-pulse" />
                                    </div>
                                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/20 z-10" />
                                </div>
                                <div className={cn(
                                    "text-xs font-black px-2 py-1 rounded bg-white/5 border border-white/10",
                                    numericalEval >= 0 ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {numericalEval > 0 ? `+${numericalEval}` : numericalEval}
                                </div>
                            </div>

                            <div className="w-full max-w-[600px] aspect-square shadow-[0_40px_100px_rgba(0,0,0,0.9)] rounded-[2.5rem] overflow-hidden border-[16px] border-[#151518] bg-[#151518] relative">
                                <Chessboard
                                    position={chess.fen()}
                                    boardOrientation="white"
                                    animationDuration={600}
                                    customDarkSquareStyle={{ backgroundColor: "#1a1b1e" }}
                                    customLightSquareStyle={{ backgroundColor: "#2d2e33" }}
                                    customBoardStyle={{
                                        borderRadius: '4px',
                                    }}
                                />
                                <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-md"></div>
                            </div>
                        </div>

                        {/* Tactical Intel Surface */}
                        <div className="w-full lg:w-[480px] flex flex-col bg-[#070709] border-l border-white/5 ring-1 ring-white/5">
                            <div className="p-10 space-y-2 bg-gradient-to-b from-white/[0.02] to-transparent">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                                        <BrainCircuit className="w-6 h-6 text-primary shadow-[0_0_15px_rgba(255,215,0,0.3)]" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Neural Oversight</DialogTitle>
                                        <DialogDescription className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/40 mt-1">
                                            {engineLoading ? "CALCULATING_DEPTH_12 // PROCESSING" : "SYMMETRIC_THREAT_ANALYSIS // ACTIVE"}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="p-10 pt-0 space-y-10">
                                    {/* Evaluation Summary */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-1">
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Best Move</p>
                                            <p className="text-xl font-black text-primary font-mono">{bestMove}</p>
                                        </div>
                                        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-1">
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Threat Level</p>
                                            <p className={cn(
                                                "text-xl font-black font-mono",
                                                threatLevel === "CRITICAL" ? "text-rose-500" : threatLevel === "HIGH" ? "text-amber-500" : "text-emerald-500"
                                            )}>{threatLevel}</p>
                                        </div>
                                    </div>

                                    {/* Player Stats / Accuracy */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-5 p-5 rounded-[2rem] bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 group hover:border-emerald-500/40 transition-all">
                                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                                                <User className="w-7 h-7" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-black text-white uppercase tracking-tighter">{game.white}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <Badge className={cn(
                                                        "text-[8px] border-none",
                                                        riskScore > 70 ? "bg-rose-500/20 text-rose-500" : "bg-emerald-500/20 text-emerald-500"
                                                    )}>
                                                        {engineLoading ? "SYNCING..." : `RISK: ${riskScore}%`}
                                                    </Badge>
                                                    <span className="text-[10px] font-black text-white/20 uppercase">{game.whiteElo} ELO</span>
                                                </div>
                                            </div>
                                            <AlertTriangle className="w-4 h-4 text-emerald-500 opacity-20" />
                                        </div>

                                        <div className="flex items-center gap-5 p-5 rounded-[2rem] bg-gradient-to-r from-rose-500/10 to-transparent border border-rose-500/20 group hover:border-rose-500/40 transition-all">
                                            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-500">
                                                <User className="w-7 h-7" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-black text-white uppercase tracking-tighter">{game.black}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <Badge className="bg-rose-500/20 text-rose-500 text-[8px] border-none">ACC: 82.1%</Badge>
                                                    <span className="text-[10px] font-black text-white/20 uppercase">{game.blackElo} ELO</span>
                                                </div>
                                            </div>
                                            <Zap className="w-4 h-4 text-rose-500 opacity-20" />
                                        </div>
                                    </div>

                                    {/* Battle Log Refined */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Crosshair className="w-4 h-4 text-primary" />
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Battle Sequence</span>
                                            </div>
                                            <span className="text-[10px] font-black text-white/10 uppercase font-mono">STEP_{moveHistory.length}</span>
                                        </div>

                                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 min-h-[300px]">
                                            <div className="grid grid-cols-2 gap-3">
                                                {moveHistory.length === 0 && (
                                                    <div className="col-span-2 text-center py-20 opacity-20 text-[10px] font-black uppercase tracking-[0.4em]">Awaiting Engagement...</div>
                                                )}
                                                {moveHistory.map((move, i) => {
                                                    const classification = getClassification(i);
                                                    return (
                                                        <div key={i} className="flex flex-col gap-1 group/move">
                                                            <div className="flex gap-3 text-[11px] font-mono items-center">
                                                                <span className="text-white/10 w-5 font-black text-[9px]">{i % 2 === 0 ? Math.floor(i / 2) + 1 + '.' : ''}</span>
                                                                <span className="font-bold text-white/80 bg-white/5 px-3 py-2 rounded-xl border border-white/5 transition-all group-hover/move:border-primary/40 group-hover/move:bg-primary/5 flex-1 text-center relative overflow-hidden">
                                                                    {move}
                                                                    {classification && (
                                                                        <div className={cn(
                                                                            "absolute bottom-0 left-0 h-[2px] w-full",
                                                                            classification === "BRILLIANT" ? "bg-cyan-400" : classification === "GREAT" ? "bg-emerald-400" : "bg-rose-500"
                                                                        )} />
                                                                    )}
                                                                </span>
                                                            </div>
                                                            {classification && (
                                                                <span className={cn(
                                                                    "text-[7px] font-black uppercase text-center tracking-widest mt-0.5",
                                                                    classification === "BRILLIANT" ? "text-cyan-400" : classification === "GREAT" ? "text-emerald-400" : "text-rose-500"
                                                                )}>
                                                                    !! {classification}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>

                            {/* Control Protocol Terminal */}
                            <div className="p-8 border-t border-white/5 bg-white/[0.01]">
                                <div className="flex gap-4">
                                    <button className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all">Abort Protocol</button>
                                    <button className="flex-1 py-4 bg-primary/10 border border-primary/20 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/20 transition-all">Force Draw</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
