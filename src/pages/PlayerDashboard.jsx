import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Trophy, Gamepad2, Zap, Target, History, Users, TrendingUp, Award, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const PlayerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        elo: user?.elo || 1200,
        wins: user?.wins || 0,
        losses: user?.losses || 0,
        draws: user?.draws || 0,
        totalGames: user?.games || 0,
        rank: "Unranked"
    });

    // Calculate win rate
    const winRate = stats.totalGames > 0 ? ((stats.wins / stats.totalGames) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-8 pb-12">
            {/* Welcome Header */}
            <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-indigo-500/20 transition-all duration-700" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase font-outfit">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{user?.username || "Commander"}</span>
                        </h1>
                        <p className="text-white/40 font-medium tracking-wide">Your next victory is waiting. The arena is synchronized and ready.</p>
                    </div>
                    <Button className="h-16 px-8 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-lg shadow-lg shadow-indigo-500/20 group/btn overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                        <Play className="w-6 h-6 mr-2 fill-current" />
                        START NEW BATTLE
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "ELO RATING", value: stats.elo, icon: Target, color: "text-indigo-400", bg: "bg-indigo-400/10" },
                    { label: "TOTAL BATTLES", value: stats.totalGames, icon: Gamepad2, color: "text-purple-400", bg: "bg-purple-400/10" },
                    { label: "WIN RATE", value: `${winRate}%`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                    { label: "ARENA RANK", value: stats.rank, icon: Award, color: "text-amber-400", bg: "bg-amber-400/10" },
                ].map((stat, i) => (
                    <Card key={i} className="bg-white/5 border-white/5 backdrop-blur-sm rounded-3xl overflow-hidden group hover:border-white/10 transition-all duration-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("p-3 rounded-2xl", stat.bg)}>
                                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                                </div>
                                <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                                    <div className={cn("h-full w-2/3 rounded-full", stat.color.replace('text', 'bg'))} />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-black text-white font-outfit">{stat.value}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <Card className="lg:col-span-2 bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-6 px-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-500/20">
                                <History className="w-5 h-5 text-indigo-400" />
                            </div>
                            <CardTitle className="text-xl font-bold text-white uppercase tracking-tight">Recent Battles</CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10 uppercase text-[10px] font-black tracking-widest">
                            View All History
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-white/5">
                            {[1, 2, 3, 4, 5].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-all">
                                            <Zap className={cn("w-5 h-5", i % 2 === 0 ? "text-emerald-400" : "text-rose-400")} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white uppercase tracking-wide">Opponent_Alpha_{i}</h4>
                                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Rapid • 10+0 • 2h ago</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("font-black text-lg", i % 2 === 0 ? "text-emerald-400" : "text-rose-400")}>
                                            {i % 2 === 0 ? "+12" : "-8"}
                                        </p>
                                        <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                                            {i % 2 === 0 ? "VICTORY" : "DEFEAT"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar Cards */}
                <div className="space-y-8">
                    {/* Active Challenges */}
                    <Card className="bg-indigo-500/10 border-indigo-500/20 backdrop-blur-md rounded-[2rem] overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px] -mr-16 -mt-16" />
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-indigo-400" />
                                Live Tournaments
                            </CardTitle>
                            <CardDescription className="text-white/40 text-xs">Join an active battle now</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Blitz Master</span>
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase">Live</span>
                                </div>
                                <h5 className="font-bold text-white text-sm">Winter Rapid Cup 2024</h5>
                                <div className="flex items-center gap-2 text-[10px] text-white/30 font-bold uppercase">
                                    <Users className="w-3 h-3" />
                                    128 Players Online
                                </div>
                                <Button className="w-full h-10 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs uppercase tracking-widest">
                                    Enter Arena
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Links */}
                    <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] overflow-hidden p-6">
                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Quick Actions</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Analyze", icon: Zap },
                                { label: "Puzzles", icon: Target },
                                { label: "Friends", icon: Users },
                                { label: "Profile", icon: Award },
                            ].map((action, i) => (
                                <button key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                                    <action.icon className="w-5 h-5 text-white/40 group-hover:text-indigo-400 transition-colors" />
                                    <span className="text-[10px] font-black text-white/40 group-hover:text-white uppercase tracking-widest">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PlayerDashboard;
