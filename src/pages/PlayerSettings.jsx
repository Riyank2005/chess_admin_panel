import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Palette, Volume2, Shield, Monitor, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const PlayerSettings = () => {
    return (
        <div className="space-y-8 pb-12">
            <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 p-8">
                <h1 className="text-4xl font-black text-white tracking-tight uppercase mb-4">Neural Interface Settings</h1>
                <p className="text-white/40 font-medium">Personalize your arena experience and system feedback.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] p-8">
                    <CardTitle className="text-xl font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                        <Palette className="w-5 h-5 text-indigo-400" />
                        Visual Configuration
                    </CardTitle>
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold text-white uppercase tracking-wide">Dark Mode Matrix</Label>
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Enhanced low-light visibility</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold text-white uppercase tracking-wide">Glassmorphism Effects</Label>
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Premium interface transparency</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </div>
                </Card>

                <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] p-8">
                    <CardTitle className="text-xl font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                        <Volume2 className="w-5 h-5 text-purple-400" />
                        System Audio
                    </CardTitle>
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold text-white uppercase tracking-wide">Move Sound FX</Label>
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Haptic and acoustic feedback</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold text-white uppercase tracking-wide">Alert Notifications</Label>
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Critical battle ground updates</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PlayerSettings;
