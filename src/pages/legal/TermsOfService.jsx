import { Shield, FileText, CheckCircle, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
    const lastUpdated = "February 02, 2026";

    return (
        <div className="min-h-screen bg-[#070708] text-white font-outfit selection:bg-primary selection:text-black">
            {/* Background Ambient Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 chess-grid opacity-[0.03]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
                {/* Header */}
                <div className="mb-16 text-center">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Chess Master Legal protocol</span>
                    </div>
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-4">
                        Terms of <span className="text-primary">Service</span>
                    </h1>
                    <p className="text-white/40 text-sm font-black uppercase tracking-widest">
                        Last Calibration: {lastUpdated}
                    </p>
                </div>

                {/* Content Node */}
                <div className="glass-card rounded-[2.5rem] p-10 border-white/5 space-y-12">

                    <section className="space-y-4">
                        <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-tight text-white">
                            <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
                            01. Strategic Engagement
                        </h2>
                        <p className="text-white/60 leading-relaxed">
                            By accessing the CHESS MASTER Strategic Command Terminal ("The Platform"), you acknowledge the initialization of a binding legal protocol between yourself ("Operator") and Chess Master Intelligence. If you do not agree to these parameters, you must terminate your session immediately.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-tight text-white">
                            <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                            02. Operator Conduct & Integrity
                        </h2>
                        <p className="text-white/60 leading-relaxed">
                            All combatants on the chess grid are subject to continuous neural monitoring (Arbiter AI). Engine-assisted maneuvers, outside assistance, or any attempts to manipulate the spectral integrity of matches will result in immediate NODE QUARANTINE (Permanent Ban) and loss of ELO assets.
                        </p>
                        <ul className="grid gap-3 mt-6">
                            {[
                                "Zero tolerance for engine-based strategic spoofing.",
                                "Prohibited use of automated script protocols.",
                                "Strict non-disclosure of high-clearance administrative bugs."
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-white/40 bg-white/5 p-4 rounded-xl border border-white/5 hover:border-primary/20 transition-all">
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-tight text-white">
                            <div className="w-1.5 h-6 bg-primary rounded-full" />
                            03. Data Sovereignty
                        </h2>
                        <p className="text-white/60 leading-relaxed">
                            Chess Master reserves the right to archive, analyze, and broadcast all match telemetry for the purpose of global ranking synchronization and platform improvement. Your performance data is an immutable record on our distributed ledger.
                        </p>
                    </section>

                    <section className="space-y-4 pt-8 border-t border-white/5">
                        <p className="text-[10px] text-white/20 italic text-center uppercase tracking-[0.2em]">
                            System Disclosure: These terms are governing laws of the Chess Master Ecosystem.
                        </p>
                    </section>
                </div>

                {/* Footer Navigation */}
                <div className="mt-12 flex justify-center gap-6">
                    <Link to="/login">
                        <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary">
                            Return to Authentication
                        </Button>
                    </Link>
                    <Button variant="outline" className="prism-btn rounded-xl px-8 border-primary/20">
                        <FileText className="w-4 h-4 mr-2" />
                        Export Legal Log
                    </Button>
                </div>
            </div>
        </div>
    );
}
