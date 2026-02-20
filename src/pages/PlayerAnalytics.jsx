import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Zap,
    TrendingUp,
    Target,
    BarChart3,
    Clock,
    Swords,
    Trophy,
    Skull,
    Activity,
    ChevronRight,
    Search
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#10b981', '#f43f5e', '#6366f1', '#f59e0b'];

const PlayerAnalytics = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [ratingHistory, setRatingHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [statsRes, historyRes] = await Promise.all([
                fetch('/api/players/analytics', {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                }),
                fetch('/api/players/rating-history', {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                })
            ]);

            const statsData = await statsRes.json();
            const historyData = await historyRes.json();

            if (statsRes.ok) setStats(statsData);
            if (historyRes.ok) setRatingHistory(historyData);
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user.token]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-white/20 font-black uppercase tracking-widest text-xs">Synchronizing Tactical Data...</p>
        </div>
    );

    const pieData = [
        { name: 'Wins', value: stats?.wins || 0 },
        { name: 'Losses', value: stats?.losses || 0 },
        { name: 'Draws', value: stats?.draws || 0 },
    ];

    const tcData = Object.entries(stats?.timeControlStats || {}).map(([name, data]) => ({
        name,
        wins: data.wins,
        total: data.total,
        winRate: ((data.wins / data.total) * 100).toFixed(1)
    }));

    const openingData = Object.entries(stats?.openings || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-24 px-4 overflow-hidden">
            {/* Header Section */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-black/40 backdrop-blur-3xl p-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400/80">Operational Intelligence</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase">Strategic <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">Analytics</span></h1>
                            <p className="text-white/40 font-medium max-w-lg mt-4">Analyzing cognitive patterns and tactical execution history within the Arena.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 min-w-[300px]">
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col justify-center">
                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Combat Win Rate</span>
                                <span className="text-3xl font-black text-emerald-400">{stats?.winRate || 0}%</span>
                            </div>
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col justify-center">
                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Target ELO Avg</span>
                                <span className="text-3xl font-black text-indigo-400">{stats?.opponentStrength || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Rating Evolution */}
                <Card className="lg:col-span-2 bg-white/5 border-white/5 backdrop-blur-md rounded-[2.5rem] p-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <TrendingUp className="w-48 h-48 text-white" />
                    </div>
                    <CardHeader className="px-0 pt-0 pb-8 border-b border-white/5 mb-8">
                        <CardTitle className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <Activity className="w-5 h-5 text-indigo-400" />
                            Rating Evolution
                        </CardTitle>
                    </CardHeader>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={ratingHistory}>
                                <defs>
                                    <linearGradient id="colorElo" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    hide={true}
                                />
                                <YAxis
                                    domain={['dataMin - 50', 'dataMax + 50']}
                                    stroke="#ffffff20"
                                    fontSize={10}
                                    tickFormatter={(val) => val}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0a0b0d',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="elo"
                                    stroke="#6366f1"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorElo)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Conflict Outcome (Pie Chart) */}
                <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2.5rem] p-8 flex flex-col">
                    <CardHeader className="px-0 pt-0 pb-8 border-b border-white/5 mb-8">
                        <CardTitle className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <Swords className="w-5 h-5 text-rose-500" />
                            Conflict Outcome
                        </CardTitle>
                    </CardHeader>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="h-64 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={10}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0a0b0d',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#fff'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Efficiency</span>
                                <span className="text-2xl font-black text-white">{stats?.winRate || 0}%</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 w-full mt-8">
                            {[
                                { label: 'Wins', val: stats?.wins, icon: Trophy, color: 'text-emerald-400' },
                                { label: 'Losses', val: stats?.losses, icon: Skull, color: 'text-rose-500' },
                                { label: 'Draws', val: stats?.draws, icon: Activity, color: 'text-indigo-400' }
                            ].map(item => (
                                <div key={item.label} className="text-center space-y-1">
                                    <item.icon className={cn("w-4 h-4 mx-auto", item.color)} />
                                    <p className="text-lg font-black text-white">{item.val}</p>
                                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Time Control Efficiency */}
                <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2.5rem] p-8 overflow-hidden relative">
                    <CardHeader className="px-0 pt-0 pb-8 border-b border-white/5 mb-8">
                        <CardTitle className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <Clock className="w-5 h-5 text-indigo-400" />
                            Temporal Mastery
                        </CardTitle>
                    </CardHeader>
                    <div className="space-y-6">
                        {tcData.length === 0 ? (
                            <p className="text-center py-12 text-white/20 font-black uppercase text-[10px] tracking-widest">No Temporal Data Detected</p>
                        ) : (
                            tcData.map(tc => (
                                <div key={tc.name} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-white uppercase">{tc.name}</span>
                                            <Badge variant="outline" className="text-[8px] h-4 bg-white/5 border-white/10 text-white/40">{tc.total} EXMS</Badge>
                                        </div>
                                        <span className="text-xs font-black text-indigo-400">{tc.winRate}% Efficiency</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-1000"
                                            style={{ width: `${tc.winRate}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Opening Tendencies */}
                <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2.5rem] p-8 overflow-hidden relative">
                    <CardHeader className="px-0 pt-0 pb-8 border-b border-white/5 mb-8">
                        <CardTitle className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <Target className="w-5 h-5 text-cyan-400" />
                            Combat Initializers
                        </CardTitle>
                    </CardHeader>
                    <div className="space-y-4">
                        {openingData.length === 0 ? (
                            <p className="text-center py-12 text-white/20 font-black uppercase text-[10px] tracking-widest">No Signature Openings Recorded</p>
                        ) : (
                            openingData.map((opening, idx) => (
                                <div key={opening.name} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center font-black text-xs text-indigo-400">
                                            {opening.name}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white uppercase tracking-wider">{opening.name === 'e4' ? 'Kings Pawn' : opening.name === 'd4' ? 'Queens Pawn' : 'Tactical Entry'}</p>
                                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Signature ID: 00{idx + 1}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-indigo-400">{opening.count}</p>
                                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Frequency</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Operational Summary */}
                <Card className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 blur-sm group-hover:blur-none transition-all duration-700">
                        <Zap className="w-32 h-32 text-white" />
                    </div>
                    <CardHeader className="px-0 pt-0 pb-6">
                        <CardTitle className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em]">Arbiter Assessment</CardTitle>
                    </CardHeader>
                    <div className="space-y-6 relative z-10">
                        <p className="text-lg font-bold text-white leading-relaxed tracking-tight">
                            "Cognitive patterns indicate <span className="text-indigo-400">{stats?.winRate > 50 ? 'aggressive dominance' : 'calculated defense'}</span> in the Rapid sector. Tactical initializers suggest a preference for <span className="text-cyan-400">{openingData[0]?.name || 'standardized'}</span> deployments."
                        </p>
                        <div className="pt-6 border-t border-white/10">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40">
                                <span>Core Integrity</span>
                                <span className="text-emerald-400">Stable</span>
                            </div>
                            <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[94%]" />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PlayerAnalytics;
