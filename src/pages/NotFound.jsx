import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Ghost, MoveLeft, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error - Node Not Found:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070708] p-10 relative overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-rose-500/5 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none chess-grid"></div>

      <div className="text-center relative z-10 max-w-lg">
        <div className="mx-auto w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-10 group hover:border-primary/40 transition-all duration-700 hover:-translate-y-2">
          <Ghost className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-500" />
        </div>

        <div className="space-y-4 mb-12">
          <h1 className="text-8xl font-black prism-gradient-text tracking-tighter uppercase font-outfit leading-none">404</h1>
          <div className="flex items-center justify-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
            <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.5em]">Node_Transmission_Failed</p>
          </div>
          <p className="text-white/20 text-xs font-black uppercase tracking-widest mt-6 leading-relaxed">
            The requested coordinate <span className="text-primary/50 font-mono px-2">{location.pathname}</span> does not exist within the chess grid.
          </p>
        </div>

        <Link to="/">
          <Button className="prism-btn h-14 rounded-2xl px-10 group">
            <MoveLeft className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform" />
            Return to Command Hub
          </Button>
        </Link>

        <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <Terminal className="w-3 h-3 text-white/10" />
            <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">Protocol: Static_Redir</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
