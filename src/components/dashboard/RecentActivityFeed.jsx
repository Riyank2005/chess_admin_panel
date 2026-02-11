import { cn } from "@/lib/utils";
import {
  UserPlus,
  Trophy,
  AlertTriangle,
  Shield,
  Gamepad2,
  Ban,
} from "lucide-react";

// Define activities
const activities = [
  {
    id: "user_joined",
    message: "New user ChessKing2024 registered",
    time: "2 minutes ago",
    icon: UserPlus,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    id: "tournament",
    message: "Weekly Blitz Tournament started",
    time: "15 minutes ago",
    icon: Trophy,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
  },
  {
    id: "report",
    message: "User GrandMaster99 reported for cheating",
    time: "32 minutes ago",
    icon: AlertTriangle,
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
  },
  {
    id: "admin",
    message: "Admin ModeratorJohn reviewed case #1234",
    time: "1 hour ago",
    icon: Shield,
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
  },
  {
    id: "game",
    message: "Game #G789 ended (1-0)",
    time: "1 hour ago",
    icon: Gamepad2,
    iconBg: "bg-white/5",
    iconColor: "text-white/40",
  },
  {
    id: "ban",
    message: "User Cheater123 banned for engine abuse",
    time: "2 hours ago",
    icon: Ban,
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
  },
];

export function RecentActivityFeed() {
  return (
    <div className="relative">
      {/* Activity list */}
      <div className="space-y-3">
        {activities.map((activity, index) => {
          const IconComponent = activity.icon;
          return (
            <div
              key={activity.id}
              className="group relative flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 hover:bg-white/[0.03] border border-transparent hover:border-white/5"
            >
              {/* Timeline Connector */}
              {index !== activities.length - 1 && (
                <div className="absolute left-[34px] top-14 bottom-[-12px] w-[1px] bg-white/5 group-hover:bg-cyan-500/20 transition-colors" />
              )}

              {/* Geometric Icon Marker */}
              <div
                className={cn(
                  "relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(0,0,0,0.5)]",
                  activity.iconBg,
                  "border-white/5"
                )}
              >
                <IconComponent className={cn("h-5 w-5 transition-transform group-hover:rotate-12", activity.iconColor)} />
                {/* Status Dot */}
                <div className={cn(
                  "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0c]",
                  activity.id === "ban" || activity.id === "report" ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                )} />
              </div>

              {/* Data Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs font-bold text-white/90 leading-relaxed font-rajdhani tracking-wide group-hover:text-cyan-100 transition-colors">
                  {activity.message}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-mono text-[9px] font-bold text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5 group-hover:border-white/10 group-hover:text-white/50 transition-all">
                    T_{activity.time.toUpperCase().replace(/ /g, '_')}
                  </span>
                  <div className="h-[1px] flex-1 bg-white/5 group-hover:bg-gradient-to-r from-cyan-500/20 to-transparent transition-all" />
                </div>
              </div>

              {/* Side Highlight */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-cyan-400 group-hover:h-8 transition-all duration-300 rounded-l-full shadow-[0_0_10px_rgba(34,211,238,0.5)] opacity-0 group-hover:opacity-100" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
