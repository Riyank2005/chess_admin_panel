import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Gamepad2, Trophy, Settings, ChevronLeft, ChevronRight, LogOut, User, X, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const menuItems = [
    { title: "Dashboard", url: "/player", icon: LayoutDashboard, cat: "HUB" },
    { title: "Game Center", url: "/player/games", icon: Gamepad2, cat: "ARENA" },
    { title: "Tournaments", url: "/player/tournaments", icon: Trophy, cat: "ARENA" },
    { title: "Analytics", url: "/player/analytics", icon: Zap, cat: "STATS" },
    { sep: true },
    { title: "Profile", url: "/player/profile", icon: User, cat: "ACCOUNT" },
    { title: "Social Hub", url: "/player/social", icon: Users, cat: "SOCIAL" },
    { title: "Settings", url: "/player/settings", icon: Settings, cat: "SYSTEM" },
];

export function PlayerSidebar({ onClose, collapsed, setCollapsed }) {
    const { logout, user } = useAuth();
    const path = useLocation().pathname;
    const isMobile = useIsMobile();

    return (
        <aside className={cn(
            "fixed left-4 top-4 bottom-4 z-40 transition-all duration-300 rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden backdrop-blur-3xl bg-black/40",
            collapsed ? "w-20" : "w-72"
        )}>
            {/* Dynamic Grid Overlay */}
            <div className="absolute inset-0 bg-grid-white opacity-5 pointer-events-none" />

            <div className="flex h-full flex-col relative z-10 p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 px-2 pt-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                            <Gamepad2 className="w-6 h-6 text-white" />
                        </div>
                        {!collapsed && (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                                <h1 className="text-lg font-black text-white tracking-widest font-rajdhani uppercase">Nexus<span className="text-indigo-400">Arena</span></h1>
                                <p className="text-[10px] text-indigo-500/80 font-bold tracking-wider uppercase">Player Portal</p>
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
                                            ? "bg-white/10 text-white shadow-[0_0_20px_rgba(99,102,241,0.15)] border border-white/10"
                                            : "text-white/40 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400 shadow-[0_0_10px_#818cf8]" />
                                    )}

                                    <Icon className={cn(
                                        "h-5 w-5 flex-shrink-0 transition-colors duration-300",
                                        isActive ? "text-indigo-400" : "group-hover:text-white"
                                    )} />

                                    {!collapsed && (
                                        <span className="font-bold tracking-wide text-sm font-rajdhani uppercase">
                                            {item.title}
                                        </span>
                                    )}

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
                            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg">
                                <span className="text-xs font-black text-white">{user?.username?.[0] || "P"}</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                        </div>

                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate font-rajdhani uppercase tracking-wider">{user?.username || "Player"}</p>
                                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Active</p>
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
                    className="absolute -right-3 top-24 h-6 w-6 bg-indigo-500 text-white rounded-full flex items-center justify-center z-50 hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all border-2 border-black"
                >
                    {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                </button>
            </div>
        </aside>
    );
}
