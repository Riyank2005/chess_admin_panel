import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { Shield, FileText, Lock, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export function LegalDialog({ type = "terms", trigger }) {
    const isTerms = type === "terms";

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-[#0a0a0c] border-white/10 text-white p-0 overflow-hidden rounded-[2rem]">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full pointer-events-none" />

                <DialogHeader className="p-8 border-b border-white/5 relative z-10 bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${isTerms ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                            {isTerms ? <Shield className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                                {isTerms ? "Terms of Service" : "Privacy Policy"}
                            </DialogTitle>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">
                                Last Calibration: Feb 02, 2026
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="h-[60vh] p-8 relative z-10">
                    <div className="space-y-8 pb-8">
                        {isTerms ? (
                            <>
                                <section className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-primary" />
                                        01. Strategic Engagement
                                    </h3>
                                    <p className="text-sm text-white/60 leading-relaxed font-medium">
                                        By accessing the CHESS MASTER Strategic Command Terminal, you acknowledge the initialization of a binding legal protocol. If you do not agree to these parameters, you must terminate your session immediately.
                                    </p>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-primary" />
                                        02. Operator Conduct
                                    </h3>
                                    <p className="text-sm text-white/60 leading-relaxed font-medium">
                                        All combatants are subject to neural monitoring. Engine-assisted maneuvers or strategic spoofing will result in immediate NODE QUARANTINE (Permanent Ban).
                                    </p>
                                    <div className="space-y-2">
                                        {["Zero tolerance for engine use.", "No automated script protocols.", "Mandatory fair-play compliance."].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40 bg-white/5 p-3 rounded-lg border border-white/5">
                                                <CheckCircle className="h-3 w-3 text-primary" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-primary" />
                                        03. Data Sovereignty
                                    </h3>
                                    <p className="text-sm text-white/60 leading-relaxed font-medium">
                                        Chess Master reserves the right to archive and broadcast all match telemetry for the purpose of global ranking synchronization.
                                    </p>
                                </section>
                            </>
                        ) : (
                            <>
                                <section className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                        01. Intelligence Gathering
                                    </h3>
                                    <p className="text-sm text-white/60 leading-relaxed font-medium">
                                        We collect telemetry including ELO performance charts, move-time distribution, and network node identifiers (IP origin) for platform stabilization.
                                    </p>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                        02. Encryption Protocol
                                    </h3>
                                    <p className="text-sm text-white/60 leading-relaxed font-medium">
                                        Your credentials are encapsulated within a high-clearance encryption layer. Personal identifiers are never leaked outside the administrative nexus.
                                    </p>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                        03. Liability Waiver
                                    </h3>
                                    <p className="text-sm text-white/60 leading-relaxed font-medium">
                                        By using this terminal, you waive rights to legal recourse regarding digital asset fluctuations or node downtime during synchronization events.
                                    </p>
                                </section>
                            </>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-end relative z-10">
                    <DialogClose asChild>
                        <Button variant="outline" className="prism-btn rounded-xl px-8 border-primary/20">
                            Acknowledge Protocols
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}
