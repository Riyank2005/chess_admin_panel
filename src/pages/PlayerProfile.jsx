import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Shield, Key, Bell, Globe, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const PlayerProfile = () => {
    const { user } = useAuth();
    return (
        <div className="space-y-8 pb-12">
            <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group flex-shrink-0">
                        <div className="w-40 h-40 rounded-[3rem] bg-gradient-to-tr from-indigo-500 to-purple-500 p-1">
                            <div className="w-full h-full rounded-[2.8rem] bg-black flex items-center justify-center overflow-hidden">
                                <span className="text-6xl font-black text-white">{user?.username?.[0] || "P"}</span>
                            </div>
                        </div>
                        <button className="absolute bottom-2 right-2 p-3 bg-indigo-500 rounded-2xl text-white shadow-xl hover:scale-110 transition-transform">
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="text-center md:text-left space-y-2">
                        <h1 className="text-5xl font-black text-white tracking-tight uppercase">{user?.username || "Commander"}</h1>
                        <p className="text-indigo-400 font-bold uppercase tracking-widest text-sm">ELITE OPERATOR • RATING: {user?.elo || 1200}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                            <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-white/40 uppercase">Member since Feb 2024</span>
                            <span className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase">Identity Verified</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] p-8">
                    <CardTitle className="text-xl font-bold text-white uppercase tracking-tight mb-8">Account Configuration</CardTitle>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Universal Username</label>
                            <div className="h-14 bg-white/5 rounded-2xl border border-white/5 flex items-center px-6 text-white font-bold">{user?.username}</div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Communication Channel</label>
                            <div className="h-14 bg-white/5 rounded-2xl border border-white/5 flex items-center px-6 text-white font-bold">{user?.email}</div>
                        </div>
                        <Button className="w-full h-14 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase text-xs">UPDATE BIOMETRICS</Button>
                    </div>
                </Card>

                <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] p-8">
                    <CardTitle className="text-xl font-bold text-white uppercase tracking-tight mb-8">Security Firewall</CardTitle>
                    <div className="space-y-4">
                        <button className="w-full p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-4">
                                <Key className="w-6 h-6 text-indigo-400" />
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">ACCESS CREDENTIALS</p>
                                    <p className="text-[10px] font-bold text-white/30 truncate">LAST UPDATED: 2 DAYS AGO</p>
                                </div>
                            </div>
                            <Shield className="w-5 h-5 text-white/20 group-hover:text-white" />
                        </button>
                        <button className="w-full p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-4">
                                <Shield className="w-6 h-6 text-purple-400" />
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">TWO-FACTOR AUTH</p>
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">ACTIVE PROTECTIONS</p>
                                </div>
                            </div>
                            <Shield className="w-5 h-5 text-white/20 group-hover:text-white" />
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PlayerProfile;
