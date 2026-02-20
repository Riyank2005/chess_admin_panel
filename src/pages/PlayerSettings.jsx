import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Settings, Palette, Volume2, Shield, Monitor,
    Smartphone, Lock, LogOut, Clock, Layers,
    CheckCircle2, AlertTriangle, Key, ShieldCheck
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PlayerSettings = () => {
    const { user, updateUser, logout } = useAuth();
    const { setTheme } = useTheme();
    const [loading, setLoading] = useState(false);

    // Form states
    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: ""
    });

    // Local copies of settings for UI
    const [settings, setSettings] = useState({
        theme: user?.settings?.theme || 'dark',
        boardStyle: user?.settings?.boardStyle || 'classic',
        sounds: user?.settings?.sounds !== undefined ? user?.settings?.sounds : true,
        timeControl: user?.settings?.timeControl || '10+5'
    });

    const handleUpdateSettings = async (newSettings) => {
        try {
            const updated = { ...settings, ...newSettings };
            setSettings(updated);

            if (newSettings.theme) {
                setTheme(newSettings.theme);
            }

            const response = await fetch('/api/players/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ settings: updated })
            });

            if (!response.ok) throw new Error('Failed to update settings');

            const data = await response.json();
            updateUser({ settings: data.settings });
            toast.success("Interface recalibrated successfully");
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            toast.error("Security Ciphers do not match");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/players/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.new
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            toast.success("Security access keys updated");
            setPasswords({ current: "", new: "", confirm: "" });
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggle2FA = async (enabled) => {
        try {
            const response = await fetch('/api/players/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ twoFactorAuth: { enabled } })
            });

            if (!response.ok) throw new Error('Failed to toggle 2FA');

            const data = await response.json();
            updateUser({ twoFactorAuth: data.twoFactorAuth });
            toast.success(enabled ? "Multi-layer auth active" : "Secondary security disabled");
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24 px-4">
            {/* Header Section */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-black/40 backdrop-blur-3xl p-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <Settings className="w-5 h-5 text-indigo-400" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400/80">System Configuration</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">Interface</span></h1>
                            <p className="text-white/40 font-medium max-w-lg">Optimize your cognitive connection and security parameters for the Nexus Arena.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-end">
                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">System Status</span>
                                <span className="text-sm font-black text-emerald-400 uppercase">Operational</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Visuals & Audio */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Visual Configuration */}
                    <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2.5rem] p-8 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Palette className="w-32 h-32 text-white" />
                        </div>
                        <CardHeader className="px-0 pt-0 pb-8 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                    <Palette className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black text-white uppercase tracking-tight">Visual Interface</CardTitle>
                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Environmental Customization</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-0 pt-8 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <Label className="text-sm font-black text-white/60 uppercase tracking-wider block">System Theme</Label>
                                        <Select
                                            value={settings.theme}
                                            onValueChange={(val) => handleUpdateSettings({ theme: val })}
                                        >
                                            <SelectTrigger className="bg-black/40 border-white/5 rounded-xl h-12 text-white/80 font-bold uppercase">
                                                <SelectValue placeholder="Select Theme" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f0f1a] border-white/10">
                                                <SelectItem value="dark" className="text-white hover:bg-white/5">Dark Mode (Matrix)</SelectItem>
                                                <SelectItem value="light" className="text-white hover:bg-white/5">Light Mode (Flash)</SelectItem>
                                                <SelectItem value="glass" className="text-white hover:bg-white/5">Glassmorphism</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-sm font-black text-white/60 uppercase tracking-wider block">Board Aesthetic</Label>
                                        <Select
                                            value={settings.boardStyle}
                                            onValueChange={(val) => handleUpdateSettings({ boardStyle: val })}
                                        >
                                            <SelectTrigger className="bg-black/40 border-white/5 rounded-xl h-12 text-white/80 font-bold uppercase">
                                                <SelectValue placeholder="Select Style" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f0f1a] border-white/10">
                                                <SelectItem value="classic" className="text-white">Neo-Classic</SelectItem>
                                                <SelectItem value="futuristic" className="text-white">Cyber-Grid</SelectItem>
                                                <SelectItem value="minimal" className="text-white">Zen Minimal</SelectItem>
                                                <SelectItem value="wood" className="text-white">Grandmaster Oak</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="space-y-1">
                                            <Label className="text-sm font-black text-white uppercase tracking-wide">High Contrast Paths</Label>
                                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Maximum visual clarity for moves</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="space-y-1">
                                            <Label className="text-sm font-black text-white uppercase tracking-wide">Dynamic Animations</Label>
                                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Smooth kinetic motion effects</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Audio & Match Prefs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2.5rem] p-8 overflow-hidden">
                            <CardHeader className="px-0 pt-0 pb-6 border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                        <Volume2 className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black text-white uppercase tracking-tight">System Audio</CardTitle>
                                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Acoustic Feedback</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-0 pt-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-bold text-white uppercase tracking-wide">Master Volume</Label>
                                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">All system sounds</p>
                                    </div>
                                    <Switch
                                        checked={settings.sounds}
                                        onCheckedChange={(val) => handleUpdateSettings({ sounds: val })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-bold text-white uppercase tracking-wide">Move Notification</Label>
                                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Tactical piece strike sounds</p>
                                    </div>
                                    <Switch defaultChecked disabled={!settings.sounds} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-bold text-white uppercase tracking-wide">Clock Pulse</Label>
                                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Countdown pressure alerts</p>
                                    </div>
                                    <Switch defaultChecked disabled={!settings.sounds} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2.5rem] p-8 overflow-hidden">
                            <CardHeader className="px-0 pt-0 pb-6 border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                        <Clock className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black text-white uppercase tracking-tight">Combat Prefs</CardTitle>
                                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Match Parameters</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-0 pt-6 space-y-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Default Time Control</Label>
                                    <Select
                                        value={settings.timeControl}
                                        onValueChange={(val) => handleUpdateSettings({ timeControl: val })}
                                    >
                                        <SelectTrigger className="bg-black/40 border-white/5 rounded-xl h-10 text-white/80 text-xs font-bold uppercase">
                                            <SelectValue placeholder="Time Control" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0f0f1a] border-white/10">
                                            <SelectItem value="1+0" className="text-white">Bullet (1|0)</SelectItem>
                                            <SelectItem value="3+2" className="text-white">Blitz (3|2)</SelectItem>
                                            <SelectItem value="10+5" className="text-white">Rapid (10|5)</SelectItem>
                                            <SelectItem value="30+0" className="text-white">Classical (30|0)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <div className="space-y-0.5">
                                        <Label className="text-xs font-bold text-white uppercase tracking-wide">Auto-Queen</Label>
                                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Skip promotion dialog</p>
                                    </div>
                                    <Switch />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Security Sidebar */}
                <div className="space-y-10">
                    <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2.5rem] p-8 overflow-hidden border-indigo-500/10 relative">
                        <div className="absolute inset-0 bg-indigo-500/5 transition-opacity" />
                        <CardHeader className="px-0 pt-0 pb-6 border-b border-white/5 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                    <Shield className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-black text-white uppercase tracking-tight">Security</CardTitle>
                                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Identity Protection</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-0 pt-8 space-y-10 relative z-10">
                            <form onSubmit={handleChangePassword} className="space-y-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Change Password</Label>
                                    <Input
                                        type="password"
                                        placeholder="Current Cipher"
                                        className="bg-black/40 border-white/5 rounded-xl text-white placeholder:text-white/20"
                                        value={passwords.current}
                                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                        required
                                    />
                                    <Input
                                        type="password"
                                        placeholder="New Strategic Key"
                                        className="bg-black/40 border-white/5 rounded-xl text-white placeholder:text-white/20"
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        required
                                    />
                                    <Input
                                        type="password"
                                        placeholder="Confirm Key"
                                        className="bg-black/40 border-white/5 rounded-xl text-white placeholder:text-white/20"
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        required
                                    />
                                    <Button
                                        type="submit"
                                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-wider text-[10px] h-10 rounded-xl shadow-lg shadow-indigo-500/20"
                                        disabled={loading}
                                    >
                                        {loading ? "Re-Encrypting..." : "Update Security Cipher"}
                                    </Button>
                                </div>
                            </form>

                            <div className="pt-8 border-t border-white/5 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-2">
                                            2-Factor Auth
                                            {user?.twoFactorAuth?.enabled && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                                        </Label>
                                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest leading-relaxed">Identity verification via secondary channel</p>
                                    </div>
                                    <Switch
                                        checked={user?.twoFactorAuth?.enabled || false}
                                        onCheckedChange={toggle2FA}
                                    />
                                </div>

                                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                    <p className="text-[9px] font-bold text-amber-500/60 uppercase leading-relaxed tracking-wider">
                                        System logs indicate last successful authentication from {user?.city || 'unverified sector'} ({user?.country || 'Earth'}).
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Termination Section */}
                    <Card className="bg-rose-500/5 border-rose-500/10 backdrop-blur-md rounded-[2.5rem] p-8 overflow-hidden">
                        <CardHeader className="px-0 pt-0 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                    <LogOut className="w-5 h-5 text-rose-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-black text-white uppercase tracking-tight">Termination</CardTitle>
                                    <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">System Exit</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-0 py-4">
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed mb-6">
                                Safely disconnect your neural link and evacuate the Nexus Arena. All active sessions will be terminated.
                            </p>
                            <Button
                                onClick={logout}
                                variant="outline"
                                className="w-full border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/20 text-rose-400 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl"
                            >
                                Initiate Evacuation Sequence
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PlayerSettings;
