import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Trophy, Users, Calendar, Award, Clock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const PlayerTournaments = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        try {
            setLoading(true);
            setLoading(true);
            const storedUser = JSON.parse(localStorage.getItem("chess_admin_user") || "{}");
            const token = storedUser.token;
            const headers = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const response = await fetch("/api/tournaments", {
                headers,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[API] Failed to fetch tournaments: ${response.status}`, errorText);
                throw new Error(`Failed to fetch tournaments: ${response.status}`);
            }

            const data = await response.json();
            setTournaments(data);
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (tournament) => {
        setSelectedTournament(tournament);
        setIsDetailsOpen(true);
    };

    const handleJoin = async () => {
        if (!selectedTournament) return;

        try {
            setRegistering(true);
            const storedUser = JSON.parse(localStorage.getItem("chess_admin_user") || "{}");
            const token = storedUser.token;
            const headers = {
                "Content-Type": "application/json",
            };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const response = await fetch(`/api/tournaments/${selectedTournament._id}/register`, {
                method: "POST",
                headers,
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to join tournament");
            }

            const updatedTournament = await response.json();

            setTournaments(prev => prev.map(t => t._id === updatedTournament._id ? updatedTournament : t));
            setSelectedTournament(updatedTournament);

            toast.success(`Successfully joined ${updatedTournament.name}!`);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setRegistering(false);
        }
    };

    const isUserRegistered = (tournament) => {
        if (!user || !tournament || !tournament.enrolledPlayers) return false;
        return tournament.enrolledPlayers.some(p => p.player === user._id || p.player._id === user._id);
    };

    const TournamentCard = ({ t, isRegistered }) => (
        <Card key={t._id} className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] p-6 hover:border-amber-500/20 transition-all group">
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <Trophy className="w-6 h-6 text-amber-500" />
                </div>
                <Badge variant="outline" className="border-amber-500/20 text-amber-500 bg-amber-500/5 uppercase text-[10px] font-black tracking-widest">
                    {t.status}
                </Badge>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{t.name}</h3>
            <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-xs text-white/40 font-medium">
                    <Users className="w-3.5 h-3.5" />
                    <span>{t.players || 0} / {t.maxPlayers} Players</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(t.startTime).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wide">
                    <Award className="w-3.5 h-3.5" />
                    <span>Prize Pool: {t.prize}</span>
                </div>
            </div>
            <Button
                className={`w-full h-12 rounded-xl font-black uppercase text-xs tracking-widest ${isRegistered ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-amber-500 hover:bg-amber-400 text-black'}`}
                onClick={() => handleViewDetails(t)}
            >
                {isRegistered ? (
                    <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {t.status === 'live' ? 'Enter Arena' : 'Enrolled'}
                    </>
                ) : (
                    <>
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                )}
            </Button>
        </Card>
    );

    return (
        <div className="space-y-8 pb-12">
            <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 p-8">
                <h1 className="text-4xl font-black text-white tracking-tight uppercase mb-4">Tournament Center</h1>
                <p className="text-white/40 font-medium">Join elite competitions and climb the global rankings.</p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <Trophy className="w-12 h-12 text-white/5 mb-4" />
                    <p className="text-white/20 font-black uppercase text-[10px] tracking-widest">Scanning Arena Protocols...</p>
                </div>
            ) : tournaments.length === 0 ? (
                <div className="text-white/50 text-center py-12">No active tournaments found.</div>
            ) : (
                <div className="space-y-12">
                    {/* Active & Registered Section */}
                    {tournaments.filter(t => isUserRegistered(t) && t.status === 'live').length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xs font-black text-emerald-400 uppercase tracking-[0.4em]">Active Deployments</h2>
                                <div className="flex-1 h-px bg-emerald-500/10" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {tournaments.filter(t => isUserRegistered(t) && t.status === 'live').map((t) => (
                                    <TournamentCard key={t._id} t={t} isRegistered={true} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Open for Enrollment */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xs font-black text-amber-500 uppercase tracking-[0.4em]">Open Enlistment</h2>
                            <div className="flex-1 h-px bg-amber-500/10" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tournaments.filter(t => t.status !== 'completed' && !(isUserRegistered(t) && t.status === 'live')).map((t) => (
                                <TournamentCard key={t._id} t={t} isRegistered={isUserRegistered(t)} />
                            ))}
                        </div>
                    </div>

                    {/* Finalized Operations */}
                    {tournaments.filter(t => t.status === 'completed').length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xs font-black text-white/20 uppercase tracking-[0.4em]">Archived Conflicts</h2>
                                <div className="flex-1 h-px bg-white/5" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                                {tournaments.filter(t => t.status === 'completed').map((t) => (
                                    <TournamentCard key={t._id} t={t} isRegistered={isUserRegistered(t)} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tournament Details Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="bg-[#0f172a] border-white/10 rounded-[2rem] p-0 max-w-2xl overflow-hidden shadow-2xl">
                    {selectedTournament && (
                        <div className="flex flex-col">
                            {/* Header Banner */}
                            <div className="relative h-40 bg-gradient-to-r from-amber-600 to-orange-600 overflow-hidden">
                                <div className="absolute inset-0 bg-[url('/chess-pattern.png')] opacity-10 mix-blend-overlay" />
                                <div className="absolute bottom-0 left-0 right-0 p-8 pt-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent flex flex-col justify-end h-full">
                                    <Badge className="w-fit mb-2 bg-white/20 hover:bg-white/30 text-white border-none uppercase text-[10px] font-bold tracking-widest backdrop-blur-md">
                                        {selectedTournament.timeControl} • {selectedTournament.status}
                                    </Badge>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">{selectedTournament.name}</h2>
                                </div>
                                <Trophy className="absolute -right-8 -top-8 w-48 h-48 text-white/10 rotate-12" />
                            </div>

                            <div className="p-8">
                                <Tabs defaultValue="overview" className="space-y-8">
                                    <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl w-full grid grid-cols-3">
                                        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-black uppercase text-[10px] font-black tracking-widest">Overview</TabsTrigger>
                                        <TabsTrigger value="standings" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-black uppercase text-[10px] font-black tracking-widest">Standings</TabsTrigger>
                                        <TabsTrigger value="matches" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-black uppercase text-[10px] font-black tracking-widest">Matches</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="overview" className="space-y-8 mt-0 outline-none">
                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 rounded-xl bg-amber-500/10">
                                                        <Award className="w-5 h-5 text-amber-500" />
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase text-white/40 tracking-widest">Prize Pool</span>
                                                </div>
                                                <p className="text-2xl font-black text-white">{selectedTournament.prize}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 rounded-xl bg-blue-500/10">
                                                        <Users className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase text-white/40 tracking-widest">Participants</span>
                                                </div>
                                                <p className="text-2xl font-black text-white">
                                                    {selectedTournament.players || 0} <span className="text-sm font-medium text-white/30">/ {selectedTournament.maxPlayers}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Info Section */}
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                                Tournament Info
                                            </h3>
                                            <div className="space-y-3 bg-white/[0.02] rounded-2xl p-6 border border-white/5">
                                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                                    <span className="text-sm text-white/50">Start Time</span>
                                                    <span className="text-sm font-bold text-white">{new Date(selectedTournament.startTime).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between py-2 border-b border-white/5">
                                                    <span className="text-sm text-white/50">Format</span>
                                                    <span className="text-sm font-bold text-white uppercase">{selectedTournament.timeControl}</span>
                                                </div>
                                                <div className="flex items-center justify-between py-2">
                                                    <span className="text-sm text-white/50">Registration Deadline</span>
                                                    <span className="text-sm font-bold text-white">{new Date(selectedTournament.registrationEndDate).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        {isUserRegistered(selectedTournament) ? (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                                </div>
                                                <h3 className="text-lg font-bold text-white mb-2">You are registered!</h3>
                                                <p className="text-sm text-white/50">Get ready for the tournament start. Good luck, commander.</p>
                                                <Button className="mt-4 w-full bg-white/5 hover:bg-white/10 text-white font-bold" variant="outline" disabled>
                                                    Registration Confirmed
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <Button
                                                    onClick={handleJoin}
                                                    disabled={registering || selectedTournament.status !== 'registering'}
                                                    className="w-full h-14 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.4)] transition-all duration-300"
                                                >
                                                    {registering ? "Processing Enrollment..." : "Confirm Registration"}
                                                </Button>
                                                <p className="text-xs text-center text-white/30">
                                                    By registering, you agree to the tournament rules and fair play policy.
                                                </p>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="standings" className="mt-0 outline-none space-y-4">
                                        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                                            <table className="w-full text-left">
                                                <thead className="bg-white/5">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Rank</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Commander</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Rating</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Score</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 font-medium">
                                                    {[...selectedTournament.enrolledPlayers]
                                                        .sort((a, b) => b.points - a.points)
                                                        .map((p, idx) => (
                                                            <tr key={p.player?._id || p.player} className="hover:bg-white/[0.02] transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className={cn(
                                                                        "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black",
                                                                        idx === 0 ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]" :
                                                                            idx === 1 ? "bg-slate-300 text-black" :
                                                                                idx === 2 ? "bg-amber-700 text-white" : "text-white/40"
                                                                    )}>
                                                                        {idx + 1}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-white flex items-center gap-2">
                                                                    {p.username}
                                                                    {p.player?._id === user._id || p.player === user._id && (
                                                                        <Badge className="bg-indigo-500/20 text-indigo-400 border-none text-[8px] h-4">YOU</Badge>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 text-xs text-white/40 font-mono tracking-wider">{p.elo}</td>
                                                                <td className="px-6 py-4 text-sm font-black text-emerald-400">{p.points || 0}</td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="matches" className="mt-0 outline-none space-y-6">
                                        {selectedTournament.rounds.length === 0 ? (
                                            <div className="py-20 text-center space-y-4">
                                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                                    <Clock className="w-8 h-8 text-white/10" />
                                                </div>
                                                <p className="text-white/20 font-black uppercase text-[10px] tracking-widest">Waiting for round generation...</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-8">
                                                {selectedTournament.rounds.map((round) => (
                                                    <div key={round.roundNumber} className="space-y-4">
                                                        <div className="flex items-center gap-4">
                                                            <Badge className="bg-indigo-500 text-white border-none uppercase text-[9px] font-black tracking-widest py-1 px-3">
                                                                Round {round.roundNumber}
                                                            </Badge>
                                                            <div className="flex-1 h-px bg-white/5" />
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-4">
                                                            {round.pairings.map((pairing, pidx) => (
                                                                <div key={pidx} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-center gap-8 relative group hover:bg-white/[0.08] transition-all">
                                                                    <div className="flex flex-col items-center gap-1 w-24">
                                                                        <span className="text-xs font-bold text-white line-clamp-1">{pairing.white?.username || 'Arbiter'}</span>
                                                                        <span className="text-[8px] text-white/30 uppercase tracking-widest">White</span>
                                                                    </div>

                                                                    <div className="flex flex-col items-center gap-2">
                                                                        <Badge className={cn(
                                                                            "bg-white/10 text-[10px] font-black px-4",
                                                                            pairing.result === 'pending' ? "text-amber-500" : "text-emerald-400"
                                                                        )}>
                                                                            {pairing.result === 'pending' ? 'VS' : pairing.result}
                                                                        </Badge>
                                                                        {pairing.result === 'pending' && pairing.gameId && (
                                                                            <Button
                                                                                size="sm"
                                                                                className="h-8 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-[9px] uppercase rounded-lg"
                                                                                onClick={() => navigate(`/player/games?game=${pairing.gameId}`)}
                                                                            >
                                                                                Watch / Join
                                                                            </Button>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex flex-col items-center gap-1 w-24">
                                                                        <span className="text-xs font-bold text-white line-clamp-1">{pairing.black?.username || 'Arbiter'}</span>
                                                                        <span className="text-[8px] text-white/30 uppercase tracking-widest">Black</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default PlayerTournaments;
