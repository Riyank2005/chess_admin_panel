import { Crown, TrendingUp, TrendingDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Top players data
const topPlayers = [
  { rank: 1, name: "Magnus_C", elo: 2870, games: 45, change: 5 },
  { rank: 2, name: "Hikaru_N", elo: 2785, games: 50, change: -2 },
  { rank: 3, name: "Ding_L", elo: 2750, games: 40, change: 3 },
  { rank: 4, name: "Fabiano_C", elo: 2740, games: 38, change: 0 },
  { rank: 5, name: "Ian_N", elo: 2725, games: 42, change: -1 },
];

export function TopPlayersCard() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 bg-primary rounded-full shadow-[0_0_15px_rgba(0,198,255,0.4)]"></div>
        <h2 className="text-xl font-bold text-white tracking-tight uppercase font-outfit">
          Top Rankings
        </h2>
      </div>

      <div className="space-y-4 flex-1">
        {topPlayers.map((player) => (
          <div
            key={player.rank}
            className="group relative flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 hover:bg-white/[0.03]"
          >
            {/* Rank */}
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold font-mono transition-all duration-300 border",
                player.rank === 1
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-white/5 text-muted-foreground/40 border-white/5"
              )}
            >
              #{player.rank.toString().padStart(2, '0')}
            </div>

            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10 border border-white/10 bg-black/40">
                <AvatarFallback className="text-[10px] font-bold text-muted-foreground uppercase">
                  {player.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {player.rank === 1 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center border-2 border-[#11111a]">
                  <Crown className="w-2 h-2 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-white truncate group-hover:text-primary transition-colors">
                {player.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{player.games} Games</span>
              </div>
            </div>

            {/* Elo */}
            <div className="text-right">
              <p className="text-base font-bold text-white font-mono tracking-tighter">
                {player.elo}
              </p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                {player.change !== 0 && (
                  <span
                    className={cn(
                      "text-[9px] font-bold",
                      player.change > 0 ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {player.change > 0 ? "+" : ""}{player.change}
                  </span>
                )}
                <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">ELO</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/5">
        <p className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-[0.3em] text-center italic">Live Leaderboard Active</p>
      </div>
    </div>
  );
}
