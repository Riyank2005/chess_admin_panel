import { useState, useEffect } from "react";
import { Megaphone, X, Zap, ShieldAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function BroadcastBanner() {
    const [broadcast, setBroadcast] = useState(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const fetchBroadcast = async () => {
            try {
                const response = await fetch('/api/system/broadcast');
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.isActive) {
                        setBroadcast(data);
                        setIsVisible(true);
                    } else {
                        setBroadcast(null);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch broadcast:", error);
            }
        };

        fetchBroadcast();
        const interval = setInterval(fetchBroadcast, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    if (!broadcast || !isVisible) return null;

    const styles = {
        emergency: "from-rose-600 to-rose-900 border-rose-500/50 text-white",
        maintenance: "from-amber-600 to-amber-900 border-amber-500/50 text-white",
        announcement: "from-primary/80 to-primary/40 border-primary/50 text-black",
        neutral: "from-zinc-800 to-black border-white/10 text-white"
    };

    const icons = {
        emergency: <ShieldAlert className="w-4 h-4 animate-pulse" />,
        maintenance: <Zap className="w-4 h-4" />,
        announcement: <Megaphone className="w-4 h-4" />,
        neutral: <Info className="w-4 h-4" />
    };

    return (
        <div className={cn(
            "fixed top-0 left-0 right-0 z-[100] transition-all duration-500 animate-in slide-in-from-top",
            "bg-gradient-to-r border-b backdrop-blur-md px-6 py-2.5 flex items-center gap-4",
            styles[broadcast.type] || styles.neutral
        )}>
            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20">
                    {icons[broadcast.type] || icons.neutral}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">System Message:</span>
                    <p className="text-xs font-medium tracking-wide">
                        {broadcast.message}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsVisible(false)}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
