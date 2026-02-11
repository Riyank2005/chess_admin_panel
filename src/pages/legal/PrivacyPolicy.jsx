import { Shield, Eye, Lock, Database } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
    const lastUpdated = "February 02, 2026";

    return (
        <div className="min-h-screen bg-[#070708] text-white font-outfit selection:bg-primary selection:text-black">
            {/* Background Ambient Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 chess-grid opacity-[0.03]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
                {/* Header */}
                <div className="mb-16 text-center">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                        <Lock className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Chess Master Encryption Protocol</span>
                    </div>
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-4 text-emerald-400">
                        Privacy <span className="text-white">Policy</span>
                    </h1>
                    <p className="text-white/40 text-sm font-black uppercase tracking-widest">
                        Data Integrity Log: {lastUpdated}
                    </p>
                </div>

                {/* Content Node */}
                <div className="glass-card rounded-[2.5rem] p-10 border-white/5 space-y-12 backdrop-blur-3xl bg-white/[0.01]">

                    <section className="space-y-4">
                        <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-tight text-white">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                            01. Intelligence Gathering
                        </h2>
                        <p className="text-white/60 leading-relaxed">
                            To maintain the spectral integrity of the chess grid, we collect telemetry including ELO performance charts, move-time distribution (Neural Fingerprinting), and network node identifiers (IP origin). This data is used exclusively for platform stabilization and fair-play arbitration.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-tight text-white">
                            <div className="w-1.5 h-6 bg-primary rounded-full" />
                            02. Encryption & Security
                        </h2>
                        <p className="text-white/60 leading-relaxed">
                            Your identity credentials are encapsulated within a high-clearance encryption layer. Personal identifiers are never leaked outside the administrative system except when required for strategic auditing or tournament prize dispersal.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-tight text-white">
                            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                            03. Operator Rights
                        </h2>
                        <p className="text-white/60 leading-relaxed">
                            As an authorized operator, you have the right to request a complete wipe of your strategic records. However, note that some performance hashes may remain stored in the distributed immutable logs to prevent ELO-inflation maneuvers.
                        </p>
                    </section>

                    <section className="space-y-4 pt-8 border-t border-white/5">
                        <p className="text-[10px] text-white/20 italic text-center uppercase tracking-[0.2em]">
                            System Disclosure: Data privacy is non-negotiable within the Chess Master ecosystem.
                        </p>
                    </section>
                </div>

                {/* Footer Navigation */}
                <div className="mt-12 flex justify-center gap-6">
                    <Link to="/login">
                        <Button variant="ghost" className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-emerald-500">
                            Return to Authentication
                        </Button>
                    </Link>
                    <Button variant="outline" className="rounded-xl px-8 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10">
                        <Database className="w-4 h-4 mr-2" />
                        Download Personal Log
                    </Button>
                </div>
            </div>
        </div>
    );
}
