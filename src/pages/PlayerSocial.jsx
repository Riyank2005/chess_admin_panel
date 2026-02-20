import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    MessageSquare,
    UserPlus,
    ShieldAlert,
    Search,
    UserMinus,
    Ban,
    Send,
    Check,
    X,
    Clock,
    MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PlayerSocial = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket, emit, subscribe } = useWebSocket();
    const [loading, setLoading] = useState(true);
    const [socialInfo, setSocialInfo] = useState({ friends: [], pendingRequests: [], blockedUsers: [] });
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");

    const fetchSocialInfo = async () => {
        try {
            const response = await fetch('/api/social/info', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await response.json();
            if (response.ok) setSocialInfo(data);
        } catch (error) {
            console.error("Failed to fetch social info", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const response = await fetch(`/api/social/search?query=${query}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await response.json();
            if (response.ok) setSearchResults(data);
        } catch (error) { }
    };

    const sendRequest = async (receiverId) => {
        try {
            const response = await fetch('/api/social/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ receiverId })
            });
            const data = await response.json();
            if (response.ok) {
                toast.success("Friend request dispatched");
                setIsSearchOpen(false);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Transmission failed");
        }
    };

    const respondToRequest = async (requestId, status) => {
        try {
            const response = await fetch('/api/social/respond', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ requestId, status })
            });
            if (response.ok) {
                toast.success(`Request ${status.toLowerCase()}`);
                fetchSocialInfo();
            }
        } catch (error) { }
    };

    const toggleBlock = async (targetId) => {
        try {
            const response = await fetch('/api/social/block', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ targetId })
            });
            if (response.ok) {
                toast.success("Protocol updated");
                fetchSocialInfo();
            }
        } catch (error) { }
    };

    const fetchDMs = async (friendId) => {
        try {
            const response = await fetch(`/api/chat/dms/${friendId}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await response.json();
            if (response.ok) setMessages(data);
        } catch (error) { }
    };

    const sendDM = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedFriend) return;

        const msgData = {
            senderId: user._id,
            receiverId: selectedFriend._id,
            message: messageInput
        };

        emit('send_dm', msgData);
        setMessageInput("");
    };

    useEffect(() => {
        fetchSocialInfo();
    }, [user.token]);

    useEffect(() => {
        if (!socket) return;

        const unsubscribe = subscribe('receive_dm', (msg) => {
            // Only add if it belongs to the current chat
            if (selectedFriend && (msg.sender === selectedFriend._id || msg.receiver === selectedFriend._id)) {
                setMessages(prev => [...prev, msg]);
            }
        });

        return () => unsubscribe();
    }, [socket, selectedFriend]);

    useEffect(() => {
        if (selectedFriend) {
            fetchDMs(selectedFriend._id);
            const interval = setInterval(() => fetchDMs(selectedFriend._id), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedFriend]);

    return (
        <div className="space-y-8 pb-12">
            <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 p-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight uppercase mb-4">Tactical Social Hub</h1>
                        <p className="text-white/40 font-medium">Coordinate with allies, monitor threats, and manage your battle squad.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chat Section */}
                <Card className="lg:col-span-2 bg-white/5 border-white/5 backdrop-blur-md rounded-[2.5rem] overflow-hidden flex flex-col min-h-[600px]">
                    <CardHeader className="border-b border-white/5 p-6 bg-white/[0.02]">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                                <MessageSquare className="w-5 h-5 text-purple-400" />
                                {selectedFriend ? `COMMS: ${selectedFriend.username}` : "Secure Comms Node"}
                            </CardTitle>
                            {selectedFriend && (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">
                                    Encrypted
                                </Badge>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none bg-black/20">
                        {!selectedFriend ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                                <div className="p-8 rounded-full bg-white/5 border border-white/10">
                                    <MessageSquare className="w-16 h-16 text-white" />
                                </div>
                                <p className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Select an ally to initiate transmission</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20">
                                <p className="text-[10px] font-black uppercase tracking-widest">Starting fresh communication logs...</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div key={idx} className={cn(
                                    "flex flex-col max-w-[80%] space-y-1",
                                    msg.sender === user._id ? "ml-auto items-end" : "mr-auto items-start"
                                )}>
                                    <div className={cn(
                                        "px-4 py-3 rounded-2xl text-sm font-medium",
                                        msg.sender === user._id
                                            ? "bg-purple-600 text-white rounded-tr-none shadow-lg shadow-purple-600/10"
                                            : "bg-white/10 text-white rounded-tl-none border border-white/10"
                                    )}>
                                        {msg.message}
                                    </div>
                                    <span className="text-[8px] font-mono text-white/20 uppercase">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        )}
                    </CardContent>

                    {selectedFriend && (
                        <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                            <form onSubmit={sendDM} className="flex gap-4">
                                <Input
                                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-purple-500/20 text-white text-sm"
                                    placeholder="Enter secure transmission..."
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                />
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-black uppercase px-6 h-12 rounded-xl shadow-lg shadow-purple-600/20">
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    )}
                </Card>

                {/* Squad Management */}
                <div className="space-y-8">
                    {/* Battle Squad (Friends List) */}
                    <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2.5rem] p-8">
                        <div className="flex items-center justify-between mb-8">
                            <CardTitle className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
                                <Users className="w-5 h-5 text-pink-400" />
                                BATTLE SQUAD
                            </CardTitle>

                            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                                <DialogTrigger asChild>
                                    <Button size="icon" className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10">
                                        <UserPlus className="w-4 h-4 text-white" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#0a0b0d] border-white/5 text-white rounded-[2rem] p-8 max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Signal Scanner</DialogTitle>
                                        <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Acquiring signatures in local sector...</p>
                                    </DialogHeader>
                                    <div className="space-y-6 mt-4">
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                            <Input
                                                className="bg-white/5 border-white/10 h-12 pl-12 rounded-xl"
                                                placeholder="Search Player ID..."
                                                value={searchQuery}
                                                onChange={handleSearch}
                                            />
                                        </div>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-none">
                                            {searchResults.map(p => (
                                                <div key={p._id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-white/10 to-white/[0.05] border border-white/10 flex items-center justify-center font-black text-xs">
                                                            {p.username[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-white uppercase">{p.username}</p>
                                                            <p className="text-[10px] text-white/40 font-mono">ELO: {p.elo}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={() => sendRequest(p._id)}
                                                        className="h-10 px-4 bg-white/10 hover:bg-white text-white hover:text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all"
                                                    >
                                                        ADD ALLY
                                                    </Button>
                                                </div>
                                            ))}
                                            {searchQuery.length > 2 && searchResults.length === 0 && (
                                                <p className="text-center py-8 text-[10px] font-black uppercase tracking-widest text-white/20">No matching signatures</p>
                                            )}
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="space-y-3">
                            {socialInfo.friends.length === 0 ? (
                                <p className="text-[10px] text-white/10 font-black uppercase tracking-[0.2em] text-center py-12 border border-dashed border-white/5 rounded-2xl">Squad Roster Empty</p>
                            ) : (
                                socialInfo.friends.map(friend => (
                                    <div
                                        key={friend._id}
                                        onClick={() => setSelectedFriend(friend)}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
                                            selectedFriend?._id === friend._id
                                                ? "bg-purple-600/10 border-purple-500/30"
                                                : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center font-black text-xs text-white">
                                                    {friend.username[0].toUpperCase()}
                                                </div>
                                                <div className={cn(
                                                    "absolute -bottom-1 -right-1 w-3 h-3 border-2 border-[#12141a] rounded-full",
                                                    friend.status === 'active' ? "bg-emerald-500" : "bg-white/20"
                                                )} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white uppercase tracking-tight">{friend.username}</p>
                                                <p className="text-[9px] text-white/40 font-mono uppercase tracking-widest">ELO: {friend.elo}</p>
                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/20 hover:text-white">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-[#12141a] border-white/10 rounded-xl min-w-[140px]">
                                                <DropdownMenuItem onClick={() => navigate("/player/profile")} className="text-white/60 focus:bg-white/5 focus:text-white gap-2 font-bold uppercase text-[9px] tracking-widest py-3">
                                                    <Users className="w-3.5 h-3.5" /> PROFILE
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleBlock(friend._id)} className="text-rose-500/80 focus:bg-rose-500/10 focus:text-rose-500 gap-2 font-bold uppercase text-[9px] tracking-widest py-3">
                                                    <Ban className="w-3.5 h-3.5" /> BLOCK USER
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Pending Requests */}
                    {socialInfo.pendingRequests.length > 0 && (
                        <Card className="bg-amber-500/5 border-amber-500/10 backdrop-blur-md rounded-[2.5rem] p-8">
                            <CardTitle className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                PENDING RECRUITS
                            </CardTitle>
                            <div className="space-y-4">
                                {socialInfo.pendingRequests.map(req => (
                                    <div key={req._id} className="flex flex-col gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-[10px]">
                                                {req.sender.username[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black uppercase text-white">{req.sender.username}</p>
                                                <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">RANK: {req.sender.elo}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => respondToRequest(req._id, 'ACCEPTED')}
                                                className="flex-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black font-black uppercase text-[8px] tracking-widest h-8 rounded-lg transition-all"
                                            >
                                                <Check className="w-3 h-3 mr-1" /> ACCEPT
                                            </Button>
                                            <Button
                                                onClick={() => respondToRequest(req._id, 'REJECTED')}
                                                className="flex-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-black font-black uppercase text-[8px] tracking-widest h-8 rounded-lg transition-all"
                                            >
                                                <X className="w-3 h-3 mr-1" /> REJECT
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Fair Play Shortcut */}
                    <Card className="bg-rose-500/10 border-rose-500/20 backdrop-blur-md rounded-[2.5rem] p-8">
                        <CardTitle className="text-lg font-black text-rose-400 uppercase tracking-tight mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5" />
                            Security Alert
                        </CardTitle>
                        <p className="text-xs text-rose-400/60 leading-relaxed mb-6 font-medium">Maintain operational security. Block hostiles or report suspicious activity through the bureau.</p>
                        <Button
                            variant="outline"
                            onClick={() => navigate("/player/fair-play")}
                            className="w-full border-rose-500/30 text-rose-400 hover:bg-rose-500/30 text-[10px] font-black uppercase tracking-widest h-12 rounded-xl transition-all"
                        >
                            ENCRYPTED BUREAU
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PlayerSocial;
