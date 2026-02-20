import { useState, useEffect } from "react";
import { Bell, Check, Trash2, Zap, Trophy, Shield, Info, AlertTriangle, ExternalLink, MoreVertical } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export function PlayerNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const response = await fetch("/api/notifications?limit=10");
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            setNotifications(data.notifications);
            setUnreadCount(data.notifications.filter(n => !n.read).length);
        } catch (error) {
            console.error("Notification sync failed:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await fetch("/api/notifications/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId: id })
            });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(count => Math.max(0, count - 1));
        } catch (error) {
            toast.error("Failed to mark as read");
        }
    };

    const deleteNotification = async (id) => {
        try {
            await fetch(`/api/notifications/${id}`, { method: "DELETE" });
            setNotifications(prev => prev.filter(n => n._id !== id));
            if (!notifications.find(n => n._id === id).read) {
                setUnreadCount(count => Math.max(0, count - 1));
            }
            toast.success("Notification cleared");
        } catch (error) {
            toast.error("Failed to delete notification");
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'ALERT': return <AlertTriangle className="w-4 h-4 text-rose-400" />;
            case 'SUCCESS': return <Trophy className="w-4 h-4 text-emerald-400" />;
            case 'WARNING': return <Info className="w-4 h-4 text-amber-400" />;
            default: return <Zap className="w-4 h-4 text-indigo-400" />;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                >
                    <Bell className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 text-[10px] font-black items-center justify-center text-white">
                                {unreadCount}
                            </span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-80 p-0 overflow-hidden bg-black/90 backdrop-blur-2xl border-white/10 rounded-2xl shadow-2xl"
            >
                <div className="p-4 border-b border-white/5 bg-white/5">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-xs uppercase tracking-widest text-white">Signal Center</h3>
                        <Badge variant="outline" className="text-[9px] font-bold border-indigo-500/30 text-indigo-400">
                            {unreadCount} UNREAD
                        </Badge>
                    </div>
                </div>

                <ScrollArea className="h-[400px]">
                    {loading ? (
                        <div className="p-8 text-center space-y-2">
                            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto opacity-50" />
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Syncing Channels...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5 opacity-50">
                                <Shield className="w-6 h-6 text-white/20" />
                            </div>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">All Systems Clear</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {notifications.map((n) => (
                                <div
                                    key={n._id}
                                    className={cn(
                                        "p-4 transition-all hover:bg-white/[0.03] relative group",
                                        !n.read && "bg-indigo-500/[0.03]"
                                    )}
                                >
                                    {!n.read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                                    )}
                                    <div className="flex gap-4">
                                        <div className="mt-1 flex-shrink-0 p-2 rounded-lg bg-white/5 border border-white/5">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[11px] font-bold text-white uppercase tracking-wide truncate pr-4">
                                                    {n.title}
                                                </h4>
                                                <span className="text-[8px] font-bold text-white/30 uppercase tracking-tighter flex-shrink-0">
                                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-white/50 leading-relaxed font-medium line-clamp-2">
                                                {n.message}
                                            </p>
                                            <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!n.read && (
                                                    <button
                                                        onClick={() => markAsRead(n._id)}
                                                        className="flex items-center gap-1 text-[8px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
                                                    >
                                                        <Check className="w-3 h-3" /> Mark Read
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(n._id)}
                                                    className="flex items-center gap-1 text-[8px] font-black text-white/20 uppercase tracking-widest hover:text-rose-400 transition-colors ml-auto"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Clear
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {notifications.length > 0 && (
                    <div className="p-3 border-t border-white/5 bg-white/5">
                        <Button
                            variant="ghost"
                            className="w-full h-8 text-[9px] font-black text-white/40 uppercase tracking-widest hover:bg-white/5 hover:text-white"
                        >
                            History Archive
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
