import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { LegalDialog } from "@/components/legal/LegalDialog";
import { PlayerSidebar } from "./PlayerSidebar";
import { BroadcastBanner } from "./BroadcastBanner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { CommandMenu } from "./CommandMenu";

export function PlayerLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const isMobile = useIsMobile();

    return (
        <div className="min-h-screen bg-[#050510] flex selection:bg-indigo-500/20 font-outfit">
            <BroadcastBanner />

            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0",
                isMobile ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") : ""
            )}>
                <PlayerSidebar
                    onClose={() => setSidebarOpen(false)}
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                />
            </div>

            <main className={cn(
                "flex-1 transition-all duration-300 ease-in-out min-h-screen relative flex flex-col",
                isMobile ? "ml-0 p-4" : (collapsed ? "ml-[6rem] p-6" : "ml-[19rem] p-8")
            )}>
                {/* Top Navigation Bar / Mobile Toggle */}
                <div className="flex justify-between items-center gap-4 mb-6 sticky top-0 z-30 pointer-events-none">
                    <div className="pointer-events-auto">
                        {isMobile && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden h-10 w-10 p-0 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                            >
                                <Menu className="h-6 w-6" />
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 pointer-events-auto backdrop-blur-md bg-black/20 p-2 rounded-2xl border border-white/5">
                        <CommandMenu />
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-black/40 transition-all border-white/5">
                            <div className="h-2 w-2 rounded-full animate-pulse bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                            <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">Arena Online</span>
                        </div>
                        <ModeToggle />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 relative z-10 animate-in fade-in duration-500 slide-in-from-bottom-4">
                    <Outlet />
                </div>

                {/* Footer */}
                <div className={cn("mt-12 flex justify-between items-center text-[10px] text-white/30 uppercase tracking-widest font-bold", isMobile ? "flex-col gap-4 items-center" : "")}>
                    <div className="flex items-center gap-4">
                        <span>Nexus Arena v1.0</span>
                        <span className="text-white/10">•</span>
                        <span className="text-indigo-500/50">Combat Ready</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <LegalDialog type="terms" trigger={<button className="hover:text-indigo-400 transition-colors">Terms</button>} />
                        <LegalDialog type="privacy" trigger={<button className="hover:text-indigo-400 transition-colors">Privacy</button>} />
                    </div>
                </div>
            </main>
        </div>
    );
}
