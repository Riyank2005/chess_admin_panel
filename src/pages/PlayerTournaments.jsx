import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const PlayerTournaments = () => {
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
            const token = localStorage.getItem("token");
            const headers = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const response = await fetch("/api/tournaments", {
                headers,
            });

            if (!response.ok) throw new Error("Failed to fetch tournaments");

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
            const token = localStorage.getItem("token");
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

    return (
        <div className="space-y-8 pb-12">
            <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 p-8">
                <h1 className="text-4xl font-black text-white tracking-tight uppercase mb-4">Tournament Center</h1>
                <p className="text-white/40 font-medium">Join elite competitions and climb the global rankings.</p>
            </div>

            {loading ? (
                <div className="text-white/50 text-center py-12">Loading tournaments...</div>
            ) : tournaments.length === 0 ? (
                <div className="text-white/50 text-center py-12">No active tournaments found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tournaments.map((t) => {
                        const isRegistered = isUserRegistered(t);
                        return (
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
                                            Enrolled
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
                    })}
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

                            <div className="p-8 space-y-8">
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
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default PlayerTournaments;
