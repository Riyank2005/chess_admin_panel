import { useState, useEffect } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { LiveGamesTable } from "@/components/dashboard/LiveGamesTable";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { SentinelMap } from "@/components/dashboard/SentinelMap";
import { TopPlayersCard } from "@/components/dashboard/TopPlayersCard";
import {
  Users,
  Gamepad2,
  Trophy,
  AlertTriangle,
  Clock,
  Megaphone,
  ShieldAlert,
  Power,
  RefreshCw,
  Activity,
  Zap,
  Cpu,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "@/context/WebSocketContext";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { cn } from "@/lib/utils";
import { AdminTour } from "@/components/layout/AdminTour";

export default function Dashboard() {
  const navigate = useNavigate();
  const { subscribe, connected } = useWebSocket();
  const isOnline = useOnlineStatus();
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setRunTour(true);
      localStorage.setItem('hasSeenTour', 'true');
    }
  }, []);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [stats, setStats] = useState({ users: 0, activeGames: 0, activeHalls: 0, alerts: 0 });

  // Real-time state
  const [realTimeStats, setRealTimeStats] = useState({
    activeGames: 0,
    onlineUsers: 0,
    pendingAlerts: 0
  });

  const [liveUpdates, setLiveUpdates] = useState({
    gameMoves: 0,
    userStatus: 0,
    threatAlerts: 0,
    notifications: 0
  });

  const [systemHealth, setSystemHealth] = useState({
    cpu: "0",
    memory: { percentage: "0" }
  });

  useEffect(() => {
    fetchSystemSettings();
    fetchStats();
    fetchSystemHealth();

    const healthInterval = setInterval(fetchSystemHealth, 5000);

    // WebSocket subscriptions for real-time updates
    const unsubscribeGameUpdates = subscribe('game:move', (data) => {
      setLiveUpdates(prev => ({ ...prev, gameMoves: prev.gameMoves + 1 }));
      setRealTimeStats(prev => ({ ...prev, activeGames: data.activeGames || prev.activeGames }));
    });

    const unsubscribeUserStatus = subscribe('user:status', (data) => {
      setLiveUpdates(prev => ({ ...prev, userStatus: prev.userStatus + 1 }));
      setRealTimeStats(prev => ({ ...prev, onlineUsers: data.onlineUsers || prev.onlineUsers }));
    });

    const unsubscribeThreatAlerts = subscribe('threat:alert', (data) => {
      setLiveUpdates(prev => ({ ...prev, threatAlerts: prev.threatAlerts + 1 }));
      setRealTimeStats(prev => ({ ...prev, pendingAlerts: data.pendingAlerts || prev.pendingAlerts }));
    });

    const unsubscribeNotifications = subscribe('notification:new', (data) => {
      setLiveUpdates(prev => ({ ...prev, notifications: prev.notifications + 1 }));
      toast.info('New Notification', {
        description: data.message || 'You have a new notification.'
      });
    });

    // Fallback polling for when WebSocket is disconnected
    const interval = setInterval(() => {
      if (!connected) {
        fetchStats();
      }
    }, 30000);

    return () => {
      unsubscribeGameUpdates();
      unsubscribeUserStatus();
      unsubscribeThreatAlerts();
      unsubscribeNotifications();
      clearInterval(interval);
      clearInterval(healthInterval);
    };
  }, [subscribe, connected]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch('/api/system/stats', { headers });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Stats link failure", err);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch('/api/system/health', { headers });
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data);
      }
    } catch (err) {
      console.error("Health sync error", err);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch('/api/system', { headers });
      if (response.ok) {
        const settings = await response.json();
        if (Array.isArray(settings)) {
          const mainMode = settings.find(s => s.key === 'maintenance_mode');
          const lastMsg = settings.find(s => s.key === 'global_broadcast');
          if (mainMode) setMaintenanceMode(mainMode.value);
          if (lastMsg) setBroadcastMessage(lastMsg.value);
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const toggleMaintenance = async () => {
    const newValue = !maintenanceMode;
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch('/api/system', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          key: 'maintenance_mode',
          value: newValue,
          description: 'Prevents players from starting new games.'
        })
      });

      if (response.ok) {
        setMaintenanceMode(newValue);
        toast.success(`Maintenance Mode ${newValue ? 'Enabled' : 'Disabled'}`, {
          description: newValue ? 'Players can no longer start new games.' : 'System is fully operational.'
        });
      }
    } catch (err) {
      toast.error('Error', { description: 'Could not toggle maintenance mode.' });
    }
  };

  const sendBroadcast = async () => {
    const msg = window.prompt("Enter broadcast message:", "");
    if (!msg) return;

    const type = window.confirm("Mark as Urgent/Emergency?") ? "emergency" : "announcement";

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch('/api/system/broadcast', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: msg,
          type: type,
          durationMinutes: 60
        })
      });

      if (response.ok) {
        setBroadcastMessage(msg);
        toast.success('Broadcast Sent', {
          description: `Message sent as ${type}.`
        });
      }
    } catch (err) {
      toast.error('Error', { description: 'Could not send broadcast.' });
    }
  };

  return (
    <div className="space-y-8 p-6 min-h-screen">
      <AdminTour run={runTour} setRun={setRunTour} />
      {/* Header Layer */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-center justify-center h-16 w-16 rounded-2xl bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(0,198,255,0.1)] backdrop-blur-md">
              <Globe className="h-8 w-8 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-5xl font-black prism-gradient-text tracking-tighter font-rajdhani uppercase drop-shadow-2xl">
                Command<span className="text-white">Center</span>
              </h1>
              <p className="text-sm font-bold text-cyan-500/60 uppercase tracking-[0.3em] mt-1 pl-1">
                System Overview & Controls
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Real-time Connection Status */}
            <div className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-md border transition-all duration-300",
              connected
                ? "bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                : "bg-amber-500/10 border-amber-500/20"
            )}>
              <div className="relative">
                <div className={cn("w-2.5 h-2.5 rounded-full", connected ? "bg-emerald-400" : "bg-amber-400")} />
                {connected && <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />}
              </div>
              <span className={cn("text-xs font-bold uppercase tracking-wider", connected ? "text-emerald-400" : "text-amber-400")}>
                {connected ? 'System Online' : 'Connecting...'}
              </span>
            </div>

            {maintenanceMode && (
              <div className="bg-destructive/10 text-destructive border border-destructive/30 px-4 py-2 rounded-xl flex items-center gap-3 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <ShieldAlert className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Lockdown Active</span>
              </div>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={fetchSystemSettings}
              className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 h-10 w-10"
            >
              <RefreshCw className={cn("h-4 w-4 text-cyan-400", isLoadingSettings && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Live Counters Banner */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {[
            { label: "Moves/Sec", value: liveUpdates.gameMoves, icon: Activity, color: "text-cyan-400", border: "border-cyan-500/20", bg: "bg-cyan-500/5" },
            { label: "User Events", value: liveUpdates.userStatus, icon: Users, color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
            { label: "Threats", value: liveUpdates.threatAlerts, icon: ShieldAlert, color: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-500/5" },
            { label: "CPU Load", value: `${systemHealth.cpu}%`, icon: Cpu, color: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/5" },
            { label: "Memory", value: `${systemHealth.memory.percentage}%`, icon: Activity, color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/5" },
          ].map((stat, i) => (
            <div key={i} className={cn("flex items-center gap-3 px-4 py-2 rounded-lg border min-w-[140px]", stat.border, stat.bg)}>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
              <div>
                <p className={cn("text-lg font-black font-rajdhani leading-none", stat.color)}>{stat.value}</p>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Statistics Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Agents"
          value={stats.users.toString()}
          change={connected ? "On Grid" : "Registered"}
          changeType="neutral"
          icon={Users}
          live={connected}
          className="prism-card"
        />
        <StatCard
          title="Active Conflicts"
          value={(realTimeStats.activeGames || stats.activeGames).toString()}
          change={connected ? "Live Matches" : "In Progress"}
          changeType="neutral"
          icon={Gamepad2}
          live={connected}
          className="prism-card"
        />
        <StatCard
          title="Online Count"
          value={realTimeStats.onlineUsers.toString()}
          change="Connected"
          changeType="positive"
          icon={Zap}
          live={connected}
          className="prism-card"
        />
        <StatCard
          title="System Alerts"
          value={(realTimeStats.pendingAlerts || stats.alerts).toString().padStart(2, '0')}
          change={(realTimeStats.pendingAlerts || stats.alerts) > 0 ? "Critical" : "Stable"}
          changeType={(realTimeStats.pendingAlerts || stats.alerts) > 0 ? "negative" : "positive"}
          icon={AlertTriangle}
          live={connected}
          className="prism-card"
        />
      </div>

      {/* Main Map Projection */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 prism-card rounded-[2rem] p-0 border-cyan-500/20 group relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
          <SentinelMap />
        </div>

        <div className="prism-card rounded-[2rem] p-6 lg:p-8">
          <TopPlayersCard />
        </div>
      </div>

      {/* Current Matches Feed */}
      <div className="prism-card rounded-[2rem] group border-white/5">
        <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight font-rajdhani uppercase flex items-center gap-3">
              <Gamepad2 className="h-6 w-6 text-cyan-400" />
              Active Battlegrounds
            </h2>
            <p className="text-xs font-bold text-cyan-500/40 mt-1 uppercase tracking-widest pl-9">Real-time match telemetry</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Feed
            </div>
          </div>
        </div>
        <div className="p-6">
          <LiveGamesTable />
        </div>
      </div>

      {/* Activity and Action Center */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="prism-card rounded-[2rem] p-8 border-white/5">
          <div className="border-b border-white/5 pb-6 mb-6">
            <h2 className="text-xl font-black text-white tracking-widest font-rajdhani uppercase flex items-center gap-3">
              <Clock className="h-5 w-5 text-purple-400" />
              System Logs
            </h2>
          </div>
          <RecentActivityFeed />
        </div>

        <div className="prism-card rounded-[2rem] p-8 relative overflow-hidden group border-cyan-500/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 blur-[120px] -mr-32 -mt-32 group-hover:bg-cyan-500/10 transition-all duration-1000"></div>

          <h3 className="text-2xl font-black text-white mb-8 tracking-widest font-rajdhani uppercase flex items-center gap-4">
            <div className="relative">
              <div className="w-3 h-3 bg-cyan-400 rounded-sm rotate-45" />
              <div className="absolute inset-0 bg-cyan-400 blur-sm animate-pulse" />
            </div>
            Command Actions
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 relative z-10">
            {/* Maintenance Mode Button */}
            <button
              onClick={toggleMaintenance}
              className={`flex items-center gap-4 rounded-xl border p-5 text-left transition-all duration-300 relative overflow-hidden group/btn ${maintenanceMode
                ? 'bg-destructive/10 border-destructive/50'
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg shadow-inner group-hover/btn:scale-110 transition-all duration-300 ${maintenanceMode
                ? 'bg-destructive/20 text-destructive shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                : 'bg-white/5 text-white/60'
                }`}>
                <Power className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-white text-sm font-rajdhani uppercase tracking-wider">
                  Maintenance
                </p>
                <p className="text-[9px] font-bold text-white/40 mt-1 uppercase tracking-widest">
                  {maintenanceMode ? 'Restore System' : 'Initiate Lockdown'}
                </p>
              </div>
            </button>

            {/* Broadcast Button */}
            <button
              onClick={sendBroadcast}
              className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-5 text-left transition-all duration-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 group/btn relative overflow-hidden"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover/btn:scale-110 transition-all duration-300">
                <Megaphone className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-white text-sm font-rajdhani uppercase tracking-wider">Broadcast</p>
                <p className="text-[9px] font-bold text-white/40 mt-1 uppercase tracking-widest truncate max-w-[120px]">
                  {broadcastMessage ? 'Update Comms' : 'Global Message'}
                </p>
              </div>
            </button>

            {/* Other Tactical Buttons */}
            <button
              onClick={() => navigate('/tournaments')}
              className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-5 text-left transition-all duration-300 hover:bg-amber-500/10 hover:border-amber-500/30 group/btn relative overflow-hidden"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover/btn:scale-110 transition-all duration-300">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-white text-sm font-rajdhani uppercase tracking-wider">Tournaments</p>
                <p className="text-[9px] font-bold text-white/40 mt-1 uppercase tracking-widest">Manage Events</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/users')}
              className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-5 text-left transition-all duration-300 hover:bg-blue-500/10 hover:border-blue-500/30 group/btn relative overflow-hidden"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover/btn:scale-110 transition-all duration-300">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-white text-sm font-rajdhani uppercase tracking-wider">Operatives</p>
                <p className="text-[9px] font-bold text-white/40 mt-1 uppercase tracking-widest">Manage Access</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
