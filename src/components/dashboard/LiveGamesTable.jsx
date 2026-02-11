import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, Trash2, Eye, Loader2, Ban, Globe, Clock, Hash, Trophy, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameViewerModal } from "./GameViewerModal";
import { toast } from "sonner";

export function LiveGamesTable() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 4000); // 4s rapid refresh
    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games?status=playing');
      if (!response.ok) throw new Error('Connection Failed');
      const data = await response.json();
      setGames(Array.isArray(data.games) ? data.games : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForceEnd = async (id, action) => {
    if (!window.confirm(`Force ${action}? Are you sure?`)) return;
    try {
      const response = await fetch(`/api/games/${id}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${localStorage.getItem('token')}` // Add if auth helps
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        fetchGames();
        toast.success(`Game Ended: ${action}`);
      }
    } catch (err) {
      toast.error('Action Failed');
    }
  };

  const handleView = (game) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  if (error) return (
    <div className="p-12 text-center rounded-3xl border border-dashed border-red-500/20 bg-red-500/5">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4 animate-pulse">
        <Ban className="h-6 w-6" />
      </div>
      <p className="text-sm font-bold text-red-400 uppercase tracking-widest">{error}</p>
      <Button variant="ghost" className="mt-4 text-xs uppercase tracking-wider text-white/40 hover:text-white" onClick={fetchGames}>Retry Connection</Button>
    </div>
  );

  return (
    <>
      <div className="relative min-h-[300px]">
        {loading && games.length === 0 && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-3xl">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-xs font-bold uppercase tracking-widest text-primary/40 mt-4">Loading Live Arena...</p>
          </div>
        )}

        {games.length === 0 && !loading && (
          <div className="p-20 flex flex-col items-center justify-center text-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
            <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6 ring-4 ring-white/5">
              <Swords className="h-10 w-10 text-white/20" />
            </div>
            <p className="text-sm font-bold text-white/40 uppercase tracking-widest">No Active Matches</p>
            <p className="text-xs font-medium text-white/20 mt-2 max-w-xs mx-auto">
              The arena is currently quiet. Trigger a seed or wait for players to join.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {games.map((game) => (
            <div
              key={game._id}
              className="group relative flex flex-col gap-4 p-6 rounded-[2rem] prism-card transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,198,255,0.15)] hover:border-cyan-500/30"
            >
              {/* Premium Ambient Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              {/* Status Header */}
              <div className="flex items-center justify-between relative z-10">
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)] animate-pulse"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 inline-block"></span>
                  Live Now
                </Badge>
                <p className="font-mono text-[10px] font-bold text-cyan-400/60 tracking-wider">
                  #{game._id ? game._id.slice(-6).toUpperCase() : "N/A"}
                </p>
              </div>

              {/* Players Section */}
              <div className="flex items-center justify-between relative py-6 z-10">
                {/* White Player */}
                <div className="flex flex-col items-start gap-3 w-1/3">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg group-hover:border-white/20 transition-all">
                      <span className="text-xl font-black text-white font-rajdhani">W</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border-2 border-[#0a0a0c] rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-300 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm truncate max-w-[100px] font-rajdhani uppercase tracking-wide">{game.white}</p>
                    <p className="text-[10px] font-mono text-white/40 font-bold">{game.whiteElo || '????'}</p>
                  </div>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center justify-center w-1/3">
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 font-black italic text-xs border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    VS
                  </div>
                  <div className="mt-3 text-[9px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded text-center border border-white/5 font-mono">
                    {game.moves || 0} MOVES
                  </div>
                </div>

                {/* Black Player */}
                <div className="flex flex-col items-end gap-3 w-1/3 text-right">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center shadow-lg group-hover:border-white/20 transition-all">
                      <span className="text-xl font-black text-white/50 font-rajdhani">B</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-black border-2 border-[#0a0a0c] rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-800 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm truncate max-w-[100px] font-rajdhani uppercase tracking-wide">{game.black}</p>
                    <p className="text-[10px] font-mono text-white/40 font-bold">{game.blackElo || '????'}</p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 relative z-10">
                <div className="bg-white/[0.03] rounded-lg p-3 flex items-center gap-3 border border-white/5 group-hover:border-white/10 transition-colors">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Control</p>
                    <p className="text-[10px] font-bold text-white font-mono uppercase">{game.timeControl}</p>
                  </div>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3 flex items-center gap-3 border border-white/5 group-hover:border-white/10 transition-colors">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Rated</p>
                    <p className="text-[10px] font-bold text-white uppercase">Official</p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 mt-2 border-t border-white/5 flex gap-2 relative z-10">
                <Button
                  onClick={() => handleView(game)}
                  className="flex-1 btn-gaming h-10 text-[10px] rounded-lg hover:text-white"
                >
                  <Eye className="w-3.5 h-3.5 mr-2" />
                  Spectate
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleForceEnd(game._id, 'abort')}
                  className="h-10 w-10 rounded-lg text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
                  title="Abort Game"
                >
                  <Ban className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <GameViewerModal
        game={games.find(g => g._id === selectedGame?._id) || selectedGame}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
