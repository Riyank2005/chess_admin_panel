import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { GameReplayViewer } from "@/components/game/GameReplayViewer";
import {
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
  Eye,
  Download,
  Users,
  Ban,
  Play,
  Pause,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function GameModeration() {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedGames, setSelectedGames] = useState([]);
  const [spectatorMode, setSpectatorMode] = useState(false);
  const [spectatingGame, setSpectatingGame] = useState(null);
  const [replayViewer, setReplayViewer] = useState(null);

  useEffect(() => {
    fetchMods();
  }, [page, statusFilter, severityFilter]);

  const fetchMods = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page);
      if (statusFilter) params.append("status", statusFilter);
      if (severityFilter) params.append("severity", severityFilter);

      const storedUser = localStorage.getItem('chess_admin_user');
      const token = storedUser ? JSON.parse(storedUser).token : null;

      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/games/moderation?${params}`, {
        headers
      });
      if (!response.ok) throw new Error("Failed to fetch moderations");

      const data = await response.json();
      setMods(data.mods);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateGame = async (gameId, reason) => {
    try {
      const storedUser = localStorage.getItem('chess_admin_user');
      const token = storedUser ? JSON.parse(storedUser).token : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch("/api/games/moderation/terminate", {
        method: "POST",
        headers,
        body: JSON.stringify({ gameId, reason })
      });

      if (!response.ok) throw new Error("Failed to terminate game");
      toast.success("Game terminated");
      fetchMods();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      LOW: "bg-blue-500/10 text-blue-700",
      MEDIUM: "bg-yellow-500/10 text-yellow-700",
      HIGH: "bg-red-500/10 text-red-700"
    };
    return colors[severity] || "";
  };

  const getStatusColor = (status) => {
    const colors = {
      FLAGGED: "bg-yellow-500/10 text-yellow-700",
      UNDER_REVIEW: "bg-blue-500/10 text-blue-700",
      CLEARED: "bg-green-500/10 text-green-700",
      TERMINATED: "bg-red-500/10 text-red-700"
    };
    return colors[status] || "";
  };

  // Bulk Actions
  const handleBulkTerminate = async () => {
    if (selectedGames.length === 0) return;

    const reason = window.prompt("Enter termination reason for selected games:");
    if (!reason) return;

    try {
      const storedUser = localStorage.getItem('chess_admin_user');
      const token = storedUser ? JSON.parse(storedUser).token : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch("/api/games/moderation/bulk-terminate", {
        method: "POST",
        headers,
        body: JSON.stringify({ gameIds: selectedGames, reason })
      });

      if (!response.ok) throw new Error("Failed to terminate games");
      toast.success(`Terminated ${selectedGames.length} games`);
      setSelectedGames([]);
      fetchMods();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleBulkBanUsers = async () => {
    if (selectedGames.length === 0) return;

    const reason = window.prompt("Enter ban reason for players in selected games:");
    if (!reason) return;

    try {
      const storedUser = localStorage.getItem('chess_admin_user');
      const token = storedUser ? JSON.parse(storedUser).token : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch("/api/games/moderation/bulk-ban", {
        method: "POST",
        headers,
        body: JSON.stringify({ gameIds: selectedGames, reason })
      });

      if (!response.ok) throw new Error("Failed to ban users");
      toast.success(`Banned players from ${selectedGames.length} games`);
      setSelectedGames([]);
      fetchMods();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Spectator Mode
  const toggleSpectatorMode = () => {
    setSpectatorMode(!spectatorMode);
    if (spectatorMode) {
      setSpectatingGame(null);
    }
  };

  const spectateGame = (gameId) => {
    setSpectatingGame(gameId);
    toast.info("Spectator mode activated", {
      description: "You are now spectating this game in real-time."
    });
  };

  // Game Replay
  const openReplayViewer = (gameData) => {
    setReplayViewer(gameData);
  };

  const closeReplayViewer = () => {
    setReplayViewer(null);
  };

  // Export PGN for selected games
  const exportSelectedPGN = async () => {
    if (selectedGames.length === 0) return;

    try {
      const response = await fetch("/api/games/export-pgn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameIds: selectedGames })
      });

      if (!response.ok) throw new Error("Failed to export PGN");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `games-${Date.now()}.pgn`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("PGN exported successfully");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Select/Deselect games
  const toggleGameSelection = (gameId) => {
    setSelectedGames(prev =>
      prev.includes(gameId)
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    );
  };

  const selectAllGames = () => {
    if (selectedGames.length === mods.length) {
      setSelectedGames([]);
    } else {
      setSelectedGames(mods.map(mod => mod.gameId));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Game Moderation</h1>
        <p className="text-muted-foreground mt-2">Review and moderate flagged games</p>
      </div>

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="FLAGGED">Flagged</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="CLEARED">Cleared</SelectItem>
            <SelectItem value="TERMINATED">Terminated</SelectItem>
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={fetchMods} disabled={loading} className="ml-auto">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedGames.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-400">
                {selectedGames.length} game{selectedGames.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleBulkTerminate}>
                  <X className="w-4 h-4 mr-2" />
                  Terminate Games
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkBanUsers}>
                  <Ban className="w-4 h-4 mr-2" />
                  Ban Players
                </Button>
                <Button size="sm" variant="outline" onClick={exportSelectedPGN}>
                  <Download className="w-4 h-4 mr-2" />
                  Export PGN
                </Button>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setSelectedGames([])}>
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Spectator Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button
            variant={spectatorMode ? "default" : "outline"}
            size="sm"
            onClick={toggleSpectatorMode}
          >
            <Eye className="w-4 h-4 mr-2" />
            {spectatorMode ? 'Exit Spectator Mode' : 'Enter Spectator Mode'}
          </Button>
          {spectatorMode && spectatingGame && (
            <Badge variant="secondary">
              Spectating Game #{spectatingGame}
            </Badge>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedGames.length === mods.length && mods.length > 0}
                  onCheckedChange={selectAllGames}
                />
              </TableHead>
              <TableHead>White</TableHead>
              <TableHead>Black</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan="8" className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : mods.length === 0 ? (
              <TableRow>
                <TableCell colSpan="8" className="text-center py-8">
                  No flagged games
                </TableCell>
              </TableRow>
            ) : (
              mods.map((mod) => (
                <TableRow key={mod._id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedGames.includes(mod.gameId)}
                      onCheckedChange={() => toggleGameSelection(mod.gameId)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{mod.whitePlayer}</TableCell>
                  <TableCell className="font-medium">{mod.blackPlayer}</TableCell>
                  <TableCell>{mod.reason}</TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(mod.severity)}>
                      {mod.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(mod.status)}>
                      {mod.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(mod.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openReplayViewer(mod)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Replay
                        </DropdownMenuItem>
                        {spectatorMode && (
                          <DropdownMenuItem onClick={() => spectateGame(mod.gameId)}>
                            <Users className="w-4 h-4 mr-2" />
                            Spectate Game
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleTerminateGame(mod.gameId, mod.reason)}>
                          <X className="w-4 h-4 mr-2" />
                          Terminate Game
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportSelectedPGN()}>
                          <Download className="w-4 h-4 mr-2" />
                          Export PGN
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Page {pagination.page} of {pagination.pages} ({pagination.total} total)
        </p>
      </div>

      {/* Game Replay Viewer Modal */}
      {replayViewer && (
        <GameReplayViewer
          gameData={replayViewer}
          onClose={closeReplayViewer}
        />
      )}
    </div>
  );
}
