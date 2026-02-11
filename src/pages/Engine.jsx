import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Cpu, AlertTriangle, Activity, Zap, Shield, Eye, RefreshCw, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const cheatingDetections = [
  { id: "NODE_CH_1", user: "Cheater123", game: "MAT_456", accuracy: 97, engineMatch: "99.2%", status: "confirmed", date: "2024-01-20" },
  { id: "NODE_CH_2", user: "SuspectPlayer", game: "MAT_789", accuracy: 92, engineMatch: "88.5%", status: "reviewing", date: "2024-01-20" },
  { id: "NODE_CH_3", user: "FairPlayer99", game: "MAT_012", accuracy: 50, engineMatch: "12.4%", status: "cleared", date: "2024-01-19" },
];

export default function Engine() {
  const [stockfishEnabled, setStockfishEnabled] = useState(true);
  const [antiCheatEnabled, setAntiCheatEnabled] = useState(true);
  const [difficulty, setDifficulty] = useState([18]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-2 bg-primary rounded-full shadow-[0_0_20px_rgba(255,215,0,0.4)]"></div>
            <div>
              <h1 className="text-4xl font-black prism-gradient-text tracking-tighter uppercase font-outfit leading-none">Neural Core</h1>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-2">Stockfish 16.1 // Integrity Protocol</p>
            </div>
          </div>
          <Button variant="outline" size="icon" className="rounded-full border-white/10 bg-white/5 hover:bg-white/10">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
        <div className="prism-card rounded-3xl p-6 border-white/5">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Core Status</p>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <p className="text-2xl font-black text-white tracking-tighter uppercase">Operational</p>
          </div>
        </div>
        <div className="prism-card rounded-3xl p-6 border-white/5">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Load Index</p>
          <p className="text-4xl font-black text-white mt-4 tracking-tighter">34.2%</p>
        </div>
        <div className="prism-card rounded-3xl p-6 border-white/5">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Synapse Count</p>
          <p className="text-4xl font-black text-blue-400 mt-4 tracking-tighter">1.2M+</p>
        </div>
        <div className="prism-card rounded-3xl p-6 border-white/5">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Quarantine Rate</p>
          <p className="text-4xl font-black text-rose-400 mt-4 tracking-tighter">0.2%</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Stockfish Config */}
        <div className="prism-card rounded-[3rem] p-10 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32"></div>
          <div className="flex items-center gap-5 mb-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-inner">
              <Cpu className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Neural Engine Host</h3>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">Deep Learning Analysis</p>
            </div>
          </div>

          <div className="space-y-10">
            <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="space-y-1">
                <p className="text-sm font-black text-white uppercase tracking-tight">Active Deployment</p>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none">Enable engine for live analysis</p>
              </div>
              <Switch checked={stockfishEnabled} onCheckedChange={setStockfishEnabled} className="data-[state=checked]:bg-primary" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Processing Depth</Label>
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 font-black uppercase tracking-widest text-[10px]">Level {difficulty[0]}</Badge>
              </div>
              <Slider
                value={difficulty}
                onValueChange={setDifficulty}
                max={20}
                min={1}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-widest">
                <span>Adaptive (1)</span>
                <span>Grandmaster (20)</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Hardware Allocation</Label>
                <span className="text-[10px] font-black text-white/60">34%</span>
              </div>
              <Progress value={34} className="h-1.5 bg-white/5" />
            </div>
          </div>
        </div>

        {/* Integrity Guard */}
        <div className="prism-card rounded-[3rem] p-10 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[100px] -mr-32 -mt-32"></div>
          <div className="flex items-center gap-5 mb-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 shadow-inner">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Integrity Guard</h3>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">Abuse & Engine Detection</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="space-y-1">
                <p className="text-sm font-black text-white uppercase tracking-tight">Heuristic Shield</p>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-none">Automated cheat identification</p>
              </div>
              <Switch checked={antiCheatEnabled} onCheckedChange={setAntiCheatEnabled} className="data-[state=checked]:bg-rose-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 group hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Nodes Scanned</span>
                </div>
                <p className="text-3xl font-black text-white tracking-tighter">1,284</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 group hover:bg-rose-500/5 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-4 w-4 text-rose-500" />
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Anomalies</span>
                </div>
                <p className="text-3xl font-black text-rose-500 tracking-tighter">12</p>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 flex items-center justify-between group cursor-help">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-5 w-5 text-rose-500 animate-pulse" />
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none">3 Critical Incidents Pending Arbiter Review</p>
              </div>
              <Button variant="ghost" className="h-8 text-[9px] uppercase font-black tracking-widest text-rose-500 hover:bg-rose-500/20">Review</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Detection Registry */}
      <div className="prism-card rounded-[2.5rem] border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-white/[0.01]">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Integrity Registry</h3>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">Historical Quarantine Data</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="hover:bg-transparent border-b border-white/5">
                <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 py-8 px-8">Operator</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Battle_Node</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Accuracy</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Stockfish_Sim</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Verdict</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 text-right px-10">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cheatingDetections.map((detection) => (
                <TableRow key={detection.id} className="group border-b border-white/[0.02] hover:bg-white/[0.03] transition-all duration-500">
                  <TableCell className="py-6 px-8 font-black text-white text-xs uppercase tracking-tighter">{detection.user}</TableCell>
                  <TableCell className="font-mono text-[11px] text-white/30 font-black">{detection.game}</TableCell>
                  <TableCell>
                    <div className="flex items-baseline gap-1">
                      <span className={cn("text-sm font-black tracking-tighter", detection.accuracy > 90 ? "text-rose-500" : "text-white/40")}>
                        {detection.accuracy}
                      </span>
                      <span className="text-[10px] font-black text-white/10">%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("text-xs font-black uppercase tracking-widest", detection.accuracy > 90 ? "text-rose-400" : "text-white/20")}>
                      {detection.engineMatch} Match
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest",
                        detection.status === "confirmed"
                          ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          : detection.status === "reviewing"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      )}
                    >
                      {detection.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-10">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white/10 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/20">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
