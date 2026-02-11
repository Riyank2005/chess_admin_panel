import { cn } from "@/lib/utils";

/**
 * Enhanced StatCard with hover-animations and pulse effects.
 */
export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-cyan-400",
  className,
}) {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-[2rem] prism-card p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,198,255,0.15)] hover:border-cyan-500/30",
      className
    )}>
      {/* Premium Ambient Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Interactive Scan Line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out z-10" />

      <div className="relative flex items-center justify-between z-20">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-[0.2em] font-rajdhani leading-none">{title}</p>
            <div className="h-0.5 w-6 bg-cyan-500/30 rounded-full group-hover:w-16 transition-all duration-500 group-hover:bg-cyan-400 group-hover:shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-4xl font-black text-white tracking-tight tabular-nums font-rajdhani leading-none drop-shadow-lg">{value}</p>
            {change && (
              <div
                className={cn(
                  "flex items-center gap-2 w-fit rounded-lg px-2 py-1 text-[9px] font-bold uppercase tracking-widest transition-all border",
                  changeType === "positive" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
                  changeType === "negative" && "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]",
                  changeType === "neutral" && "bg-white/5 text-white/40 border-white/10"
                )}
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  changeType === "positive" && "bg-emerald-500 animate-pulse",
                  changeType === "negative" && "bg-rose-500 animate-pulse",
                  changeType === "neutral" && "bg-white/40"
                )} />
                {change}
              </div>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-xl bg-[#0a0a0c] border border-white/10 shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:border-cyan-500/40 group-hover:shadow-[0_0_20px_rgba(0,198,255,0.25)] relative",
              iconColor
            )}
          >
            <div className="absolute inset-0 bg-cyan-400/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Icon className="h-7 w-7 transition-all duration-500 group-hover:drop-shadow-[0_0_8px_rgba(0,198,255,0.8)]" />
          </div>
        )}
      </div>
    </div>
  );
}
