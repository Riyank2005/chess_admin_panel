import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Shield, Key, Bell, Globe, Camera, History, Edit, Save, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

const PlayerProfile = () => {
    const { user: authUser } = useAuth(); // Basic auth user info
    const [profile, setProfile] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Edit Form State
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        avatar: "",
        privacySettings: {
            showEmail: false,
            showOnlineStatus: true,
            showGameHistory: true
        }
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('chess_token') || (authUser && authUser.token); // Adjust based on how token is stored
            // In AuthContext, it seems token is returned in login but maybe not stored separately in localStorage 'chess_token'
            // AuthContext stores 'chess_admin_user' which contains token.
            const storedUser = JSON.parse(localStorage.getItem("chess_admin_user") || "{}");
            const userToken = storedUser.token;

            if (!userToken) return;

            const res = await fetch('/api/players/profile', {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setFormData({
                    username: data.username || "",
                    email: data.email || "",
                    avatar: data.avatar || "",
                    privacySettings: data.privacySettings || {
                        showEmail: false,
                        showOnlineStatus: true,
                        showGameHistory: true
                    }
                });
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        if (history.length > 0) return; // Already fetched
        try {
             const storedUser = JSON.parse(localStorage.getItem("chess_admin_user") || "{}");
             const userToken = storedUser.token;
             
             const res = await fetch('/api/players/rating-history', {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                // Format date
                const formattedData = data.map(item => ({
                    ...item,
                    date: new Date(item.date).toLocaleDateString()
                }));
                setHistory(formattedData);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
            toast.error("Failed to load rating history");
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const storedUser = JSON.parse(localStorage.getItem("chess_admin_user") || "{}");
            const userToken = storedUser.token;

            const res = await fetch('/api/players/profile', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userToken}` 
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const updated = await res.json();
                setProfile({ ...profile, ...updated });
                toast.success("Profile updated successfully");
            } else {
                toast.error("Failed to update profile");
            }
        } catch (error) {
            console.error("Update failed", error);
            toast.error("Error updating profile");
        } finally {
            setSaving(false);
        }
    };

    const handlePrivacyChange = (key, checked) => {
        setFormData(prev => ({
            ...prev,
            privacySettings: {
                ...prev.privacySettings,
                [key]: checked
            }
        }));
    };

    if (loading) {
        return <div className="text-white text-center p-10">Loading profile...</div>;
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group flex-shrink-0">
                        <div className="w-40 h-40 rounded-[3rem] bg-gradient-to-tr from-indigo-500 to-purple-500 p-1">
                            {profile?.avatar ? (
                                <img 
                                    src={profile.avatar} 
                                    alt="Avatar" 
                                    className="w-full h-full rounded-[2.8rem] object-cover bg-black"
                                />
                            ) : (
                                <div className="w-full h-full rounded-[2.8rem] bg-black flex items-center justify-center overflow-hidden">
                                    <span className="text-6xl font-black text-white">{profile?.username?.[0]?.toUpperCase() || "P"}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-center md:text-left space-y-2">
                        <h1 className="text-5xl font-black text-white tracking-tight uppercase">{profile?.username || "Commander"}</h1>
                        <p className="text-indigo-400 font-bold uppercase tracking-widest text-sm">ELITE OPERATOR • RATING: {profile?.elo || 1200}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                            <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-white/40 uppercase">
                                Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                            {profile?.isVerified && (
                                <span className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase">
                                    Identity Verified
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs content */}
            <Tabs defaultValue="view" className="w-full" onValueChange={(val) => val === 'history' && fetchHistory()}>
                <TabsList className="grid w-full grid-cols-3 bg-white/5 p-1 rounded-2xl mb-8">
                    <TabsTrigger value="view" className="rounded-xl data-[state=active]:bg-indigo-500 data-[state=active]:text-white uppercase font-bold text-xs py-3">View Profile</TabsTrigger>
                    <TabsTrigger value="edit" className="rounded-xl data-[state=active]:bg-indigo-500 data-[state=active]:text-white uppercase font-bold text-xs py-3">Edit Profile</TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl data-[state=active]:bg-indigo-500 data-[state=active]:text-white uppercase font-bold text-xs py-3">Rating History</TabsTrigger>
                </TabsList>

                <TabsContent value="view" className="animate-in fade-in-50 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] p-8">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                                    <User className="w-5 h-5 text-indigo-400" />
                                    Player Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Username</label>
                                    <div className="text-lg font-medium text-white">{profile?.username}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Email</label>
                                    <div className="text-lg font-medium text-white">{profile?.email}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Location</label>
                                    <div className="text-lg font-medium text-white">{profile?.city ? `${profile.city}, ${profile.country}` : 'Unknown'}</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] p-8">
                            <CardHeader>
                                <CardTitle className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-purple-400" />
                                    Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-xl text-center">
                                    <div className="text-3xl font-black text-white">{profile?.wins || 0}</div>
                                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Wins</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl text-center">
                                    <div className="text-3xl font-black text-white">{profile?.losses || 0}</div>
                                    <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Losses</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl text-center">
                                    <div className="text-3xl font-black text-white">{profile?.draws || 0}</div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Draws</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl text-center">
                                    <div className="text-3xl font-black text-white">{profile?.games || 0}</div>
                                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Total Games</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="edit" className="animate-in fade-in-50 duration-500">
                    <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] p-8">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold text-white uppercase tracking-tight mb-4">Update Profile</CardTitle>
                            <CardDescription className="text-white/40">Manage your public identity and privacy preferences.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateProfile} className="space-y-8">
                                <div className="space-y-4">
                                    <div className="grid w-full items-center gap-2">
                                        <Label htmlFor="avatar" className="text-xs font-bold text-white/60 uppercase">Avatar URL</Label>
                                        <Input 
                                            id="avatar" 
                                            placeholder="https://example.com/avatar.png" 
                                            value={formData.avatar}
                                            onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                                            className="bg-black/20 border-white/10 text-white"
                                        />
                                        <p className="text-[10px] text-white/30">Enter a direct link to an image.</p>
                                    </div>
                                    
                                    <div className="grid w-full items-center gap-2">
                                        <Label htmlFor="username" className="text-xs font-bold text-white/60 uppercase">Username</Label>
                                        <Input 
                                            id="username" 
                                            value={formData.username}
                                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                                            className="bg-black/20 border-white/10 text-white"
                                        />
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-white/10">
                                        <h3 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
                                            <Lock className="w-4 h-4" /> Privacy Settings
                                        </h3>
                                        
                                        <div className="flex items-center space-x-2">
                                            <Checkbox 
                                                id="showEmail" 
                                                checked={formData.privacySettings.showEmail}
                                                onCheckedChange={(checked) => handlePrivacyChange('showEmail', checked)}
                                                className="border-white/20 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                                            />
                                            <Label htmlFor="showEmail" className="text-sm font-medium text-white/80">Show Email on Public Profile</Label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox 
                                                id="showOnlineStatus" 
                                                checked={formData.privacySettings.showOnlineStatus}
                                                onCheckedChange={(checked) => handlePrivacyChange('showOnlineStatus', checked)}
                                                className="border-white/20 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                                            />
                                            <Label htmlFor="showOnlineStatus" className="text-sm font-medium text-white/80">Show Online Status</Label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox 
                                                id="showGameHistory" 
                                                checked={formData.privacySettings.showGameHistory}
                                                onCheckedChange={(checked) => handlePrivacyChange('showGameHistory', checked)}
                                                className="border-white/20 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                                            />
                                            <Label htmlFor="showGameHistory" className="text-sm font-medium text-white/80">Public Game History</Label>
                                        </div>
                                    </div>
                                </div>

                                <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase rounded-xl w-full py-6">
                                    {saving ? "Saving Changes..." : "Save Configuration"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="animate-in fade-in-50 duration-500">
                    <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2rem] p-8">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold text-white uppercase tracking-tight mb-4 flex items-center gap-3">
                                <History className="w-5 h-5 text-indigo-400" />
                                Rating Progression
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            {history.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={history}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                        <XAxis dataKey="date" stroke="#ffffff40" tick={{fontSize: 12}} />
                                        <YAxis stroke="#ffffff40" tick={{fontSize: 12}} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="elo" 
                                            stroke="#6366f1" 
                                            strokeWidth={3}
                                            dot={{ fill: '#6366f1', strokeWidth: 2 }}
                                            activeDot={{ r: 8 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-white/30">
                                    <div className="text-lg font-bold uppercase">No rating history available</div>
                                    <p className="text-xs">Play games to establish your history.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PlayerProfile;
