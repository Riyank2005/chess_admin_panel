import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  Eye,
  Trash2,
  FileText,
  Globe,
  Gamepad2,
  History,
  AlertTriangle,
  RefreshCw,
  Download,
  X,
  Loader2,
  Ban,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { LiveGamesTable } from "@/components/dashboard/LiveGamesTable";

export default function Games() {
  const [searchQuery, setSearchQuery] = useState("");
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGames, setSelectedGames] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("live");
  const [filters, setFilters] = useState({
    status: "",
    white: "",
    black: "",
    timeControl: "",
    dateFrom: "",
    dateTo: "",
    minMoves: "",
    maxMoves: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (activeTab !== "live") {
      fetchGames();
    }
  }, [filters, pagination.page, activeTab]);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "") params.append(key, value);
    });
    params.append("page", pagination.page.toString());
    params.append("limit", pagination.limit.toString());
    return params.toString();
  };

  const fetchGames = async () => {
    try {
      setLoading(true);
      const queryString = buildQueryParams();
      const response = await fetch(`/api/games?${queryString}`);
      if (!response.ok) throw new Error("Failed to fetch games");
      const data = await response.json();
      setGames(Array.isArray(data.games) ? data.games : []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkOperation = async (operation) => {
    if (selectedGames.length === 0) {
      toast.error("No games selected");
      return;
    }

    const confirmMessage = {
      delete: `Permanently delete ${selectedGames.length} game(s)? This cannot be undone!`,
      abort: `Abort ${selectedGames.length} game(s)?`,
      draw: `Mark ${selectedGames.length} game(s) as draw?`,
    };

    if (!window.confirm(confirmMessage[operation] || "Continue?")) return;

    try {
      const response = await fetch("/api/games/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameIds: selectedGames,
          operation,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Bulk ${operation} completed: ${result.affected} affected`);
        setSelectedGames([]);
        fetchGames();
      } else {
        throw new Error("Bulk operation failed");
      }
    } catch (err) {
      toast.error(`Bulk operation failed: ${err.message}`);
    }
  };

  const deleteGame = async (id) => {
    if (!window.confirm("Permanently delete this game record?")) return;
    try {
      const response = await fetch(`/api/games/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.warning("Game deleted");
        fetchGames();
      }
    } catch (err) {
      toast.error("Delete Failed");
    }
  };

  const exportGames = () => {
    const csvHeader = "ID,White,Black,White ELO,Black ELO,Time Control,Status,Moves,Result,Created At\n";
    const csvRows = games.map((game) => {
      return [
        game._id || "",
        game.white || "",
        game.black || "",
        game.whiteElo || "",
        game.blackElo || "",
        game.timeControl || "",
        game.status || "",
        game.moves || "",
        game.result || "",
        new Date(game.createdAt).toISOString(),
      ]
        .map((field) => `"${String(field).replace(/"/g, '""')}"`)
        .join(",");
    }).join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `games_export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("Games exported successfully");
  };

  const toggleSelectGame = (gameId) => {
    setSelectedGames((prev) =>
      prev.includes(gameId)
        ? prev.filter((id) => id !== gameId)
        : [...prev, gameId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedGames.length === games.length) {
      setSelectedGames([]);
    } else {
      setSelectedGames(games.map((g) => g._id));
    }
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      white: "",
      black: "",
      timeControl: "",
      dateFrom: "",
      dateTo: "",
      minMoves: "",
      maxMoves: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setSearchQuery("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSeed = async () => {
    if (!window.confirm("Populate database with test games and players?")) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/system/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        fetchGames();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to seed database");
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = Array.isArray(games) ? games : [];
  const completedGames = filteredGames.filter((g) => g.status === "completed" || g.status === "drawn");
  const abandonedGames = filteredGames.filter((g) => g.status === "aborted" || g.status === "abandoned");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-1.5 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter prism-gradient-text font-rajdhani uppercase drop-shadow-lg">
                Active Operations
              </h1>
              <p className="text-sm font-bold text-cyan-500/60 mt-1 uppercase tracking-[0.2em] pl-1">
                Monitor live conflicts and archives
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {activeTab !== "live" && (
              <Button
                variant="outline"
                onClick={exportGames}
                className="gap-2 border-white/10 rounded-xl bg-white/5 text-xs font-bold uppercase tracking-wider h-10 px-4 hover:border-cyan-500/30 hover:text-cyan-400"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleSeed}
              className="gap-2 border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 h-10 px-4 text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <RefreshCw className="h-4 w-4" />
              Populate Data
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchGames}
              className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-cyan-400 h-10 w-10 hover:border-cyan-500/30"
            >
              <RefreshCw className={loading ? "animate-spin h-4 w-4" : "h-4 w-4"} />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[2rem] prism-card p-6 border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-[0.2em] font-rajdhani">
            Total Games
          </p>
          <p className="text-4xl font-black text-white mt-4 tracking-tight tabular-nums font-rajdhani">
            {pagination.total || games.length}
          </p>
        </div>
        <div className="rounded-[2rem] prism-card p-6 border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-[0.2em] font-rajdhani">
            Live Now
          </p>
          <p className="text-4xl font-black text-emerald-400 mt-4 tracking-tight tabular-nums font-rajdhani drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
            {games.filter((g) => g.status === "playing").length}
          </p>
        </div>
        <div className="rounded-[2rem] prism-card p-6 border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] font-bold text-blue-400/60 uppercase tracking-[0.2em] font-rajdhani">
            Completed Today
          </p>
          <p className="text-4xl font-black text-blue-400 mt-4 tracking-tight tabular-nums font-rajdhani drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            {
              games.filter(
                (g) =>
                  (g.status === "completed" || g.status === "drawn") &&
                  new Date(g.createdAt).toDateString() === new Date().toDateString()
              ).length
            }
          </p>
        </div>
        <div className="rounded-[2rem] prism-card p-6 border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-[10px] font-bold text-rose-400/60 uppercase tracking-[0.2em] font-rajdhani">
            Selected
          </p>
          <p className="text-4xl font-black text-rose-400 mt-4 tracking-tight tabular-nums font-rajdhani drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">
            {selectedGames.length}
          </p>
        </div>
      </div>

      {/* Tabs / Terminal Area */}
      <div className="rounded-[2.5rem] prism-card border-white/5 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-6 pb-4 border-b border-white/5 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white/[0.01]">
            <TabsList className="bg-white/5 border border-white/10 rounded-xl h-12 p-1 gap-1">
              <TabsTrigger
                value="live"
                className="rounded-lg px-6 font-bold uppercase tracking-wider text-[10px] data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all font-rajdhani"
              >
                <Gamepad2 className="w-3 h-3 mr-2" />
                Active
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="rounded-lg px-6 font-bold uppercase tracking-wider text-[10px] data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all font-rajdhani"
              >
                <History className="w-3 h-3 mr-2" />
                History
              </TabsTrigger>
              <TabsTrigger
                value="abandoned"
                className="rounded-lg px-6 font-bold uppercase tracking-wider text-[10px] data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all font-rajdhani"
              >
                <AlertTriangle className="w-3 h-3 mr-2" />
                Aborted
              </TabsTrigger>
            </TabsList>

            {activeTab !== "live" && (
              <div className="flex gap-3 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    placeholder="Search operations..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") fetchGames();
                    }}
                    className="pl-11 bg-white/[0.03] border-white/5 h-10 rounded-xl text-white placeholder:text-white/20 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all font-mono text-xs"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2 border-white/10 rounded-xl h-10 px-4 bg-white/5 text-white/40 hover:text-white hover:border-white/20"
                >
                  <Filter className="h-4 w-4" />
                </Button>
                {(Object.values(filters).some((v) => v) || searchQuery) && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    size="icon"
                    className="h-10 w-10 border-white/10 bg-white/5 rounded-xl text-white/40 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && activeTab !== "live" && (
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="bg-white/[0.03] border-white/5 h-10 rounded-xl text-xs font-mono">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="playing">Playing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="drawn">Drawn</SelectItem>
                  <SelectItem value="aborted">Aborted</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="White Operative"
                value={filters.white}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, white: e.target.value }))
                }
                className="bg-white/[0.03] border-white/5 h-10 rounded-xl text-xs font-mono"
              />

              <Input
                placeholder="Black Operative"
                value={filters.black}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, black: e.target.value }))
                }
                className="bg-white/[0.03] border-white/5 h-10 rounded-xl text-xs font-mono"
              />

              <Input
                placeholder="Time Protocol"
                value={filters.timeControl}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, timeControl: e.target.value }))
                }
                className="bg-white/[0.03] border-white/5 h-10 rounded-xl text-xs font-mono"
              />

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min Moves"
                  value={filters.minMoves}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, minMoves: e.target.value }))
                  }
                  className="bg-white/[0.03] border-white/5 h-10 rounded-xl text-xs font-mono"
                />
                <Input
                  type="number"
                  placeholder="Max Moves"
                  value={filters.maxMoves}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, maxMoves: e.target.value }))
                  }
                  className="bg-white/[0.03] border-white/5 h-10 rounded-xl text-xs font-mono"
                />
              </div>

              <Input
                type="date"
                placeholder="From Date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
                className="bg-white/[0.03] border-white/5 h-10 rounded-xl text-xs font-mono"
              />

              <Input
                type="date"
                placeholder="To Date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                }
                className="bg-white/[0.03] border-white/5 h-10 rounded-xl text-xs font-mono"
              />
            </div>
          )}

          {/* Bulk Actions */}
          {selectedGames.length > 0 && activeTab !== "live" && (
            <div className="px-6 py-4 border-b border-white/5 bg-cyan-500/5 flex items-center gap-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-rajdhani">
                {selectedGames.length} selected
              </span>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkOperation("abort")}
                  className="h-8 text-xs border-orange-500/20 text-orange-400 hover:bg-orange-500/10 uppercase font-bold tracking-wider"
                >
                  <Ban className="h-3 w-3 mr-1" />
                  Abort
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkOperation("draw")}
                  className="h-8 text-xs border-blue-500/20 text-blue-400 hover:bg-blue-500/10 uppercase font-bold tracking-wider"
                >
                  <Scale className="h-3 w-3 mr-1" />
                  Draw
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkOperation("delete")}
                  className="h-8 text-xs border-rose-500/20 text-rose-400 hover:bg-rose-500/10 uppercase font-bold tracking-wider"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          <TabsContent value="live" className="p-4 animate-in fade-in duration-500">
            <LiveGamesTable />
          </TabsContent>

          <TabsContent value="completed" className="p-0 animate-in fade-in duration-500">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
              </div>
            )}
            <div className="overflow-x-auto scrollbar-none">
              <Table>
                <TableHeader className="bg-white/[0.01]">
                  <TableRow className="hover:bg-transparent border-b border-white/5">
                    <TableHead className="w-12 py-6 px-4">
                      <Checkbox
                        checked={selectedGames.length === completedGames.length && completedGames.length > 0}
                        onCheckedChange={toggleSelectAll}
                        className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                      />
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/60 py-6 px-6 font-rajdhani">
                      Game ID
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/60 font-rajdhani">
                      White
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/60 font-rajdhani">
                      Black
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/60 font-rajdhani">
                      Time
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/60 font-rajdhani">
                      Moves
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/60 font-rajdhani">
                      Result
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/60 text-right px-6 font-rajdhani">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!loading && completedGames.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-64 text-center">
                        <Globe className="h-12 w-12 text-white/5 mx-auto mb-4" />
                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4 font-rajdhani">
                          No Completed Games Found
                        </p>
                        <Button
                          variant="outline"
                          onClick={handleSeed}
                          className="gap-2 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 uppercase text-[10px] tracking-widest font-bold"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Populate Test Data
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    completedGames.map((game) => (
                      <TableRow
                        key={game._id}
                        className="group border-b border-white/[0.02] hover:bg-white/[0.03] transition-all duration-300"
                      >
                        <TableCell className="py-4 px-4">
                          <Checkbox
                            checked={selectedGames.includes(game._id)}
                            onCheckedChange={() => toggleSelectGame(game._id)}
                            className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                          />
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="font-mono text-xs text-cyan-400 font-bold">
                            {game._id ? game._id.slice(-6).toUpperCase() : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-white text-sm font-rajdhani">
                          {game.white}
                        </TableCell>
                        <TableCell className="font-bold text-white/70 text-sm font-rajdhani">
                          {game.black}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold border-white/5 bg-white/[0.02] text-white/60 rounded-md px-2 py-1 uppercase tracking-wider font-mono"
                          >
                            {game.timeControl}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm font-bold text-white/60 tabular-nums">
                          {game.moves || 0}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "text-[9px] font-bold uppercase tracking-widest rounded-lg px-2 py-0.5 border",
                              game.result === "1-0" || game.result === "0-1"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                                : "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                            )}
                          >
                            {game.result || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                              onClick={() => deleteGame(game._id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="abandoned" className="p-0 animate-in fade-in duration-500">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
              </div>
            )}
            <div className="overflow-x-auto scrollbar-none">
              <Table>
                <TableHeader className="bg-white/[0.01]">
                  <TableRow className="hover:bg-transparent border-b border-white/5">
                    <TableHead className="w-12 py-6 px-4">
                      <Checkbox
                        checked={selectedGames.length === abandonedGames.length && abandonedGames.length > 0}
                        onCheckedChange={toggleSelectAll}
                        className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                      />
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/60 py-6 px-6 font-rajdhani">
                      Game ID
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/60 font-rajdhani">
                      White
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/60 font-rajdhani">
                      Black
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/60 font-rajdhani">
                      Time
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/60 font-rajdhani">
                      Reason
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/60 text-right px-6 font-rajdhani">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!loading && abandonedGames.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64 text-center">
                        <Globe className="h-12 w-12 text-white/5 mx-auto mb-4" />
                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest font-rajdhani">
                          No Aborted Games Found
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    abandonedGames.map((game) => (
                      <TableRow
                        key={game._id}
                        className="group border-b border-white/[0.02] hover:bg-white/[0.03] transition-all duration-300"
                      >
                        <TableCell className="py-4 px-4">
                          <Checkbox
                            checked={selectedGames.includes(game._id)}
                            onCheckedChange={() => toggleSelectGame(game._id)}
                            className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                          />
                        </TableCell>
                        <TableCell className="py-4 px-6 font-mono text-xs text-cyan-400 font-bold">
                          {game._id ? game._id.slice(-6).toUpperCase() : "N/A"}
                        </TableCell>
                        <TableCell className="font-bold text-white text-sm font-rajdhani">
                          {game.white}
                        </TableCell>
                        <TableCell className="font-bold text-white/70 text-sm font-rajdhani">
                          {game.black}
                        </TableCell>
                        <TableCell className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                          {game.timeControl}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[9px] font-bold uppercase tracking-widest rounded-lg px-2 py-0.5 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                            {game.description || game.status || "Aborted"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                              onClick={() => deleteGame(game._id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {pagination.pages > 1 && activeTab !== "live" && (
          <div className="flex items-center justify-between p-6 border-t border-white/5">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-rajdhani">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1}
                className="h-8 px-4 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-white/50 uppercase text-[10px] tracking-widest font-bold"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.pages, prev.page + 1),
                  }))
                }
                disabled={pagination.page === pagination.pages}
                className="h-8 px-4 border-white/10 bg-white/5 hover:bg-white/10"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
