import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ShieldCheck,
    ShieldAlert,
    AlertTriangle,
    Scale,
    FileText,
    MessageSquare,
    Clock,
    ArrowRight,
    Search,
    User,
    CheckCircle2,
    XCircle,
    Gavel,
    History
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PlayerFairPlay = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isAppealOpen, setIsAppealOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    // Form states
    const [reportForm, setReportForm] = useState({
        reportedId: "",
        reason: "ENGINE_ASSISTANCE",
        evidence: "",
        gameId: ""
    });

    const [appealDescription, setAppealDescription] = useState("");

    const fetchReports = async () => {
        try {
            const response = await fetch('/api/reports/my-reports', {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setReports(data || []);
            }
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [user.token]);

    const handleCreateReport = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(reportForm)
            });

            if (!response.ok) throw new Error('Failed to submit report');

            toast.success("Intelligence report dispatched to the Arbiter");
            setIsReportOpen(false);
            setReportForm({ reportedId: "", reason: "ENGINE_ASSISTANCE", evidence: "", gameId: "" });
            fetchReports();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleSubmitAppeal = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/reports/${selectedReport._id}/appeal`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ description: appealDescription })
            });

            if (!response.ok) throw new Error('Failed to submit appeal');

            toast.success("Restriction appeal filed for review");
            setIsAppealOpen(false);
            setAppealDescription("");
            fetchReports();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'RESOLVED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'PENDING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'REJECTED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'REVIEWED': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            default: return 'bg-white/5 text-white/40 border-white/10';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24 px-4">
            {/* Header */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-black/40 backdrop-blur-3xl p-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Scale className="w-5 h-5 text-emerald-400" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/80">Ethics & Integrity Portal</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">Fair <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">Play</span></h1>
                            <p className="text-white/40 font-medium max-w-lg">Maintaining the sanctity of the Arena through cognitive evaluation and arbiter oversight.</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="px-6 py-4 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-end min-w-[200px]">
                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">Risk Assessment Score</span>
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full transition-all duration-1000",
                                                user.fairPlayRiskScore < 30 ? "bg-emerald-500" : user.fairPlayRiskScore < 70 ? "bg-amber-500" : "bg-rose-500"
                                            )}
                                            style={{ width: `${user.fairPlayRiskScore || 0}%` }}
                                        />
                                    </div>
                                    <span className="text-2xl font-black text-white">{user.fairPlayRiskScore || 0}%</span>
                                </div>
                            </div>
                            <Badge className={cn(
                                "h-6 px-3 rounded-full border text-[9px] font-black uppercase tracking-widest",
                                user.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            )}>
                                Status: {user.status || 'Active'}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Reports Feed */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-white/30" />
                            <h3 className="text-sm font-black text-white uppercase tracking-widest opacity-60">Enforcement History</h3>
                        </div>
                        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="bg-emerald-500 text-black hover:bg-emerald-400 font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl"
                                >
                                    Report Misconduct
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#0a0b0d] border-white/5 text-white rounded-[2rem] p-8 max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">Security Dispatch</DialogTitle>
                                    <DialogDescription className="text-white/40">Provide coordinates for arbiter investigation.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateReport} className="space-y-6 mt-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 ml-1">Suspect Username</Label>
                                        <Input
                                            placeholder="Enter target ID..."
                                            className="bg-white/5 border-white/10 rounded-xl h-12 focus:ring-emerald-500/20 transition-all"
                                            value={reportForm.reportedId}
                                            onChange={(e) => setReportForm({ ...reportForm, reportedId: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 ml-1">Violation Category</Label>
                                        <Select
                                            value={reportForm.reason}
                                            onValueChange={(v) => setReportForm({ ...reportForm, reason: v })}
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#12141a] border-white/10 text-white rounded-xl">
                                                <SelectItem value="ENGINE_ASSISTANCE">Engine Assistance</SelectItem>
                                                <SelectItem value="HARASSMENT">Harassment</SelectItem>
                                                <SelectItem value="STALLING_TIME">Stalling / Griefing</SelectItem>
                                                <SelectItem value="ABUSIVE_LANGUAGE">Abusive Language</SelectItem>
                                                <SelectItem value="OTHER">Other Misconduct</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 ml-1">Supporting Evidence</Label>
                                        <Textarea
                                            placeholder="Describe relevant game events or attach coordinates..."
                                            className="bg-white/5 border-white/10 rounded-xl min-h-[120px] focus:ring-emerald-500/20 transition-all resize-none"
                                            value={reportForm.evidence}
                                            onChange={(e) => setReportForm({ ...reportForm, evidence: e.target.value })}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] h-14 rounded-2xl transition-all shadow-lg shadow-emerald-500/10">
                                        SUBMIT TO ARBITER
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-32 bg-white/5 rounded-[2rem] animate-pulse border border-white/5" />
                            ))
                        ) : reports.length === 0 ? (
                            <Card className="bg-white/[0.02] border-white/5 border-dashed rounded-[2rem] p-12 text-center">
                                <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                                    <ShieldCheck className="w-10 h-10 text-emerald-500/20" />
                                </div>
                                <h4 className="text-white font-black uppercase tracking-tight text-lg">Signal Clear</h4>
                                <p className="text-white/20 text-sm mt-2 font-medium">No misconduct reports found in your local sector.</p>
                            </Card>
                        ) : (
                            reports.map(report => (
                                <Card key={report._id} className="bg-white/5 border-white/5 rounded-[2rem] overflow-hidden group hover:border-white/10 transition-all">
                                    <div className="p-6 flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className={cn(
                                                "h-12 w-12 rounded-2xl flex items-center justify-center",
                                                report.reported._id === user._id ? "bg-rose-500/10" : "bg-emerald-500/10"
                                            )}>
                                                {report.reported._id === user._id ? <ShieldAlert className="w-6 h-6 text-rose-500" /> : <Gavel className="w-6 h-6 text-emerald-500" />}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                                                        {report.reported._id === user._id ? "Incoming Violation Alert" : "Outgoing Conduct Report"}
                                                    </span>
                                                    <Badge className={cn("text-[8px] px-2 h-4 border", getStatusStyle(report.status))}>
                                                        {report.status}
                                                    </Badge>
                                                </div>
                                                <h4 className="text-white font-black uppercase text-sm tracking-tight">
                                                    {report.reported._id === user._id
                                                        ? `Restrictive Action: ${report.reason.replace(/_/g, ' ')}`
                                                        : `Reported: ${report.reported.username}`
                                                    }
                                                </h4>
                                                <p className="text-white/30 text-[10px] font-mono italic">Sector: {new Date(report.createdAt).toLocaleString()} // ID: #{report._id.slice(-8)}</p>
                                            </div>
                                        </div>
                                        {report.reported._id === user._id && report.appeal?.status === 'NONE' && (
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedReport(report);
                                                    setIsAppealOpen(true);
                                                }}
                                                className="border-white/10 text-white/60 hover:text-white hover:bg-white/5 rounded-xl h-10 font-bold uppercase text-[9px] tracking-widest"
                                            >
                                                APPEAL
                                            </Button>
                                        )}
                                        {report.appeal?.status !== 'NONE' && (
                                            <Badge className={cn(
                                                "h-6 px-3 border text-[9px] font-black",
                                                report.appeal.status === 'PENDING' ? "bg-amber-500/5 text-amber-500 border-amber-500/10" :
                                                    report.appeal.status === 'APPROVED' ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/10" :
                                                        "bg-rose-500/5 text-rose-500 border-rose-500/10"
                                            )}>
                                                Appeal: {report.appeal.status}
                                            </Badge>
                                        )}
                                    </div>
                                    {report.status === 'RESOLVED' && report.adminNotes && (
                                        <div className="px-6 pb-6 pt-0 ml-16">
                                            <div className="bg-black/20 border border-white/5 p-4 rounded-xl space-y-2">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Arbiter Decision</span>
                                                <p className="text-xs text-white/50 leading-relaxed italic">"{report.adminNotes}"</p>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-10">
                    <Card className="bg-white/5 border-white/5 backdrop-blur-md rounded-[2.5rem] p-8 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Scale className="w-24 h-24 text-white" />
                        </div>
                        <CardTitle className="text-lg font-black text-white uppercase tracking-tight mb-6">Arbiter Protocol</CardTitle>
                        <div className="space-y-6">
                            <div className="space-y-4">
                                {[
                                    { label: 'Integrity Rating', val: '98%', color: 'text-emerald-400' },
                                    { label: 'Cognitive Sync', val: '0.04ms', color: 'text-cyan-400' },
                                    { label: 'Node Uptime', val: '99.9%', color: 'text-indigo-400' }
                                ].map(stat => (
                                    <div key={stat.label} className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{stat.label}</span>
                                        <span className={cn("text-sm font-black italic", stat.color)}>{stat.val}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2 text-[10px] text-white/30 font-medium leading-relaxed">
                                <p>• Neural assistance (Engines) is strictly forbidden during active combat.</p>
                                <p>• Temporal stalling (Stalling) will result in score degradation.</p>
                                <p>• Cognitive harassment via comms node will trigger a sector mute.</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/5 rounded-[2.5rem] p-8">
                        <CardTitle className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Security Support</CardTitle>
                        <p className="text-sm text-white/60 font-medium leading-relaxed mb-6">If you believe your profile has been compromised or restricted incorrectly, please dispatch an appeal through the portal.</p>
                        <Button className="w-full bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest h-12 rounded-xl text-[10px]">
                            Dispatch Secure Appeal
                        </Button>
                    </Card>
                </div>
            </div>

            {/* Appeal Dialog */}
            <Dialog open={isAppealOpen} onOpenChange={setIsAppealOpen}>
                <DialogContent className="bg-[#0a0b0d] border-white/5 text-white rounded-[2rem] p-8 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Restriction Appeal</DialogTitle>
                        <DialogDescription className="text-white/40">Present your defense coordinates for cognitive review.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitAppeal} className="space-y-6 mt-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest opacity-50 ml-1">Defense Description</Label>
                            <Textarea
                                placeholder="Explain why your coordinates do not violate operational integrity..."
                                className="bg-white/5 border-white/10 rounded-xl min-h-[160px] focus:ring-emerald-500/20 transition-all resize-none"
                                value={appealDescription}
                                onChange={(e) => setAppealDescription(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] h-14 rounded-2xl transition-all shadow-lg shadow-emerald-500/10">
                            DISPATCH APPEAL
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const Label = ({ children, className }) => (
    <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}>
        {children}
    </label>
);

export default PlayerFairPlay;
