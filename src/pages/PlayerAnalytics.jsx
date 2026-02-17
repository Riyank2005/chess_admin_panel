import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, TrendingUp, Target, BarChart3, Clock } from "lucide-react";

const PlayerAnalytics = () => {
    return (
        <div className="space-y-8 pb-12">
            <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10 p-8">
                <h1 className="text-4xl font-black text-white tracking-tight uppercase mb-4">Strategic Analytics</h1>
                <p className="text-white/40 font-medium">Deep dive into your performance patterns and tactical growth.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] p-8">
                    <CardTitle className="text-xl font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Rating Progress
                    </CardTitle>
                    <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                        <p className="text-white/20 font-bold uppercase tracking-[0.2em] text-xs">Progress Graph Initializing...</p>
                    </div>
                </Card>

                <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] p-8">
                    <CardTitle className="text-xl font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-2">
                        <Target className="w-5 h-5 text-cyan-400" />
                        Tactical Accuracy
                    </CardTitle>
                    <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                        <p className="text-white/20 font-bold uppercase tracking-[0.2em] text-xs">Accuracy Matrix Synchronizing...</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PlayerAnalytics;
