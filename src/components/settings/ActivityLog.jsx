import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, History, Terminal, User, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActivityLog({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        // Pointing to /api/audit which is the correct endpoint for system logs
        const res = await fetch('/api/audit?limit=20', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) throw new Error('Failed to fetch activity logs');

        const data = await res.json();
        if (mounted) setLogs(data.logs || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load activity logs');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchLogs();
    return () => { mounted = false; };
  }, []);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] bg-[#0A0A12] border-white/10 rounded-[2rem] overflow-hidden flex flex-col p-0 outline-none">
        <DialogHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <Terminal className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-white uppercase tracking-tighter">System Activity Stream</DialogTitle>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">Real-time Admin Audit Trail</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black/20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Synchronizing Logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <History className="h-12 w-12 text-white/5" />
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest">No activity found in recent records</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="group relative flex items-start gap-5 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-300"
                >
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center border",
                      log.action === 'BAN' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                        log.action === 'SETTINGS_UPDATE' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" :
                          "bg-blue-500/10 border-blue-500/20 text-blue-400"
                    )}>
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-white/20" />
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{log.adminName || 'SYSTEM'}</span>
                        <span className="text-[10px] text-white/10 font-mono">/</span>
                        <span className="text-[10px] font-black text-cyan-400/80 uppercase tracking-widest bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10">
                          {log.action}
                        </span>
                      </div>
                      <span className="font-mono text-[9px] text-white/20 uppercase">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-white/90 leading-relaxed font-rajdhani">
                      {log.details || `Performed ${log.action} on ${log.target}`}
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                      <div className="h-[1px] flex-1 bg-white/5" />
                      <span className="text-[9px] font-mono text-white/10 group-hover:text-white/30 transition-colors">
                        SEGMENT: {log.target}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-end">
          <Button
            onClick={onClose}
            className="rounded-xl h-11 px-8 bg-white/5 border border-white/10 text-white hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest transition-all shadow-inner"
          >
            Acknowledge & Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
