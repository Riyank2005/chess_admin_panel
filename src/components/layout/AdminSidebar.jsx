import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Gamepad2, Trophy, BarChart3, AlertTriangle, Settings, ChevronLeft, ChevronRight, Cpu, LogOut, Shield, Bell, Key, Clock, X, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LegalDialog } from "@/components/legal/LegalDialog";
import { useIsMobile } from "@/hooks/use-mobile";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, cat: "MAIN" },
  { title: "Players", url: "/users", icon: Users, cat: "MAIN" },
  { title: "Games", url: "/games", icon: Gamepad2, cat: "MAIN" },
  { title: "Tournaments", url: "/tournaments", icon: Trophy, cat: "MAIN" },
  { title: "Engine", url: "/engine", icon: Cpu, cat: "MAIN" },
  { title: "Analytics", url: "/analytics", icon: BarChart3, cat: "MAIN" },
  { title: "Reports", url: "/reports", icon: AlertTriangle, cat: "MAIN" },
  { title: "Settings", url: "/settings", icon: Settings, cat: "MAIN" },
  { sep: true },
  { title: "User Management", url: "/admin/user-management", icon: Shield, cat: "ADMIN" },
  { title: "Game Moderation", url: "/admin/game-moderation", icon: Gamepad2, cat: "ADMIN" },
  { title: "Notifications", url: "/admin/notifications", icon: Bell, cat: "ADMIN" },
  { title: "API Keys", url: "/admin/api-keys", icon: Key, cat: "ADMIN" },
  { title: "Scheduled Tasks", url: "/admin/scheduled-tasks", icon: Clock, cat: "ADMIN" },
];

export function AdminSidebar({ onClose, collapsed, setCollapsed }) {
  const { logout, user } = useAuth();
  const path = useLocation().pathname;
  const isMobile = useIsMobile();


  return (
    <aside className={cn(
      "fixed left-4 top-4 bottom-4 z-40 transition-all duration-300 rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden backdrop-blur-3xl bg-black/40",
      collapsed ? "w-20" : "w-72"
    )}>
      {/* Hex Grid Overlay */}
      <div className="absolute inset-0 bg-grid-white opacity-10 pointer-events-none" />

      <div className="flex h-full flex-col relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 px-2 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <h1 className="text-lg font-black text-white tracking-widest font-rajdhani uppercase">Chess<span className="text-cyan-400">Master</span></h1>
                <p className="text-[10px] text-cyan-500/80 font-bold tracking-wider uppercase">Admin Panel</p>
              </div>
            )}
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-white/50 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-none space-y-2 pr-1">
          {menuItems.map((item, i) => {
            if (item.sep) return <div key={`sep-${i}`} className={cn("my-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent", collapsed && "mx-2")} />;

            const isActive = path === item.url;
            const Icon = item.icon;
            const showCat = (i === 0 || menuItems[i - 1].sep || menuItems[i - 1].cat !== item.cat) && !collapsed;

            return (
              <div key={item.title}>
                {showCat && (
                  <p className="px-4 py-2 text-[9px] font-black text-white/30 uppercase tracking-[0.2em] font-rajdhani">
                    {item.cat}
                  </p>
                )}

                <NavLink
                  to={item.url}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xl transition-all duration-300 group relative overflow-hidden",
                    isActive
                      ? "bg-white/10 text-white shadow-[0_0_20px_rgba(0,198,255,0.15)] border border-white/10"
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                  )}

                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors duration-300",
                    isActive ? "text-cyan-400" : "group-hover:text-white"
                  )} />

                  {!collapsed && (
                    <span className="font-bold tracking-wide text-sm font-rajdhani uppercase">
                      {item.title}
                    </span>
                  )}

                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </NavLink>
              </div>
            );
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="pt-4 border-t border-white/5">
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md transition-all duration-300 hover:border-white/10",
            collapsed && "justify-center p-2"
          )}>
            <div className="relative">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <span className="text-xs font-black text-white">{user?.username?.[0] || "A"}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate font-rajdhani uppercase tracking-wider">{user?.username || "Commander"}</p>
                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Online</p>
              </div>
            )}

            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-8 w-8 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg ml-1"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-24 h-6 w-6 bg-cyan-500 text-black rounded-full flex items-center justify-center z-50 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] transition-all border-2 border-black"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>
    </aside>
  );
}
