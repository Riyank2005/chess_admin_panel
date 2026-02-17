import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight, Play, FastForward, Rewind, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

const PlayerGameAnalysis = () => {
    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 h-10 w-10 p-0">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Battle Analysis</h1>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Accuracy: 84.5%</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Board Mockup */}
                <Card className="lg:col-span-2 aspect-square bg-white/5 border-white/5 rounded-[2rem] flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.05] chess-grid" />
                    <div className="relative text-center space-y-4">
                        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                            <Brain className="w-12 h-12 text-indigo-400" />
                        </div>
                        <p className="text-white/20 font-black uppercase tracking-[0.2em] text-xs">Battle Reconstruction in Progress...</p>
                    </div>

                    {/* Controls Overlay */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
                        <Button variant="ghost" size="icon" className="text-white/40 hover:text-white"><Rewind className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" className="text-white/40 hover:text-white"><ChevronLeft className="w-6 h-6" /></Button>
                        <Button className="h-12 w-12 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white"><Play className="w-6 h-6 fill-current" /></Button>
                        <Button variant="ghost" size="icon" className="text-white/40 hover:text-white"><ChevronRight className="w-6 h-6" /></Button>
                        <Button variant="ghost" size="icon" className="text-white/40 hover:text-white"><FastForward className="w-5 h-5" /></Button>
                    </div>
                </Card>

                {/* Move List / Insights */}
                <div className="space-y-8">
                    <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] overflow-hidden">
                        <CardHeader className="border-b border-white/5 p-6">
                            <CardTitle className="text-sm font-black text-white uppercase tracking-widest">Move Transcription</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 h-[400px] overflow-y-auto scrollbar-none">
                            <div className="divide-y divide-white/5">
                                {[1, 2, 3, 4, 12, 13, 14, 15].map((move, i) => (
                                    <div key={i} className="grid grid-cols-3 p-4 hover:bg-white/[0.02] transition-colors">
                                        <div className="text-[10px] font-black text-white/20 uppercase">{i + 1}.</div>
                                        <div className="text-sm font-bold text-white uppercase tracking-wide">e4</div>
                                        <div className="text-sm font-bold text-white uppercase tracking-wide">e5</div>
                                    </div>
                                ))}
                                <div className="p-4 bg-rose-500/10 border-y border-rose-500/20">
                                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Critical Insight</p>
                                    <p className="text-xs text-white/60">Blunder detected at Move 15. The knight sacrifice was premature.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Button className="w-full h-16 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-lg shadow-lg shadow-indigo-500/20">
                        GENERATE PGN REPORT
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PlayerGameAnalysis;
