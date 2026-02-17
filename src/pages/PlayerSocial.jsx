import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, UserPlus, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const PlayerSocial = () => {
    return (
        <div className="space-y-8 pb-12">
            <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 p-8">
                <h1 className="text-4xl font-black text-white tracking-tight uppercase mb-4">Social Hub</h1>
                <p className="text-white/40 font-medium">Connect with allied commanders and challenge rivals.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] overflow-hidden">
                    <CardHeader className="border-b border-white/5 p-8">
                        <CardTitle className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <MessageSquare className="w-5 h-5 text-purple-400" />
                            Tactical Communications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-96 flex flex-col items-center justify-center space-y-4">
                        <div className="p-6 rounded-full bg-white/5 border border-white/10">
                            <MessageSquare className="w-12 h-12 text-white/10" />
                        </div>
                        <p className="text-white/20 font-black uppercase tracking-[0.2em] text-xs">No Recent Transmissions</p>
                    </CardContent>
                </Card>

                <div className="space-y-8">
                    <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] p-8">
                        <CardTitle className="text-lg font-bold text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                            <Users className="w-5 h-5 text-pink-400" />
                            BATTLE SQUAD
                        </CardTitle>
                        <div className="space-y-4">
                            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] text-center py-8">Your list is empty</p>
                            <Button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold uppercase text-xs h-12 rounded-xl">
                                <UserPlus className="w-4 h-4 mr-2" /> FIND FRIENDS
                            </Button>
                        </div>
                    </Card>

                    <Card className="bg-rose-500/10 border-rose-500/20 backdrop-blur-md rounded-[2rem] p-8">
                        <CardTitle className="text-lg font-black text-rose-400 uppercase tracking-tight mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5" />
                            Security Alert
                        </CardTitle>
                        <p className="text-xs text-rose-400/60 leading-relaxed mb-6">Always maintain operational security. Report suspicious activities via the encrypted channel.</p>
                        <Button variant="outline" className="w-full border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-[10px] font-black uppercase tracking-widest h-10 rounded-xl">OPEN REPORT CHANNEL</Button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PlayerSocial;
