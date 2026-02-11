import { useState, useEffect } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Ban,
  Trash2,
  Shield,
  UserCheck,
  Loader2,
  Globe,
  RefreshCw,
  X,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    minElo: "",
    maxElo: "",
    minRiskScore: "",
    maxRiskScore: "",
    isShadowBanned: "",
    isVerified: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, filters, pagination.page]);

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const queryString = buildQueryParams();
      const url = `/api/users?${queryString}`;

      const token = localStorage.getItem('token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        // Don't throw for 404 (just means no users found/empty DB) if initial load
        if (response.status === 404 && pagination.page === 1 && !searchQuery) {
          setUsers([]);
          setPagination({ ...pagination, total: 0, pages: 0 });
          return;
        }
        throw new Error(`Failed to fetch users (Status: ${response.status}): ${errorText}`);
      }

      const data = await response.json();

      setUsers(Array.isArray(data.users) ? data.users : []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id, data) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { "Content-Type": "application/json" };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/users/${id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
      });
      if (response.ok) {
        toast.success("User updated successfully");
        fetchUsers();
      }
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?"))
      return;
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers,
      });
      if (response.ok) {
        toast.success("User deleted");
        fetchUsers();
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Delete failed");
    }
  };

  const handleBulkOperation = async (operation) => {
    if (selectedUsers.length === 0) {
      toast.error("No users selected");
      return;
    }

    const confirmMessage = {
      ban: `Ban ${selectedUsers.length} user(s)?`,
      unban: `Unban ${selectedUsers.length} user(s)?`,
      shadowBan: `Shadow ban ${selectedUsers.length} user(s)?`,
      removeShadowBan: `Remove shadow ban from ${selectedUsers.length} user(s)?`,
      verify: `Verify ${selectedUsers.length} user(s)?`,
      delete: `Permanently delete ${selectedUsers.length} user(s)? This cannot be undone!`,
    };

    if (!window.confirm(confirmMessage[operation] || "Continue?")) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { "Content-Type": "application/json" };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch("/api/users", {
        method: "POST",
        headers,
        body: JSON.stringify({
          userIds: selectedUsers,
          operation,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Bulk ${operation} completed: ${result.affected} affected`);
        setSelectedUsers([]);
        fetchUsers();
      } else {
        throw new Error("Bulk operation failed");
      }
    } catch (err) {
      toast.error(`Bulk operation failed: ${err.message}`);
    }
  };

  const toggleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSeed = async () => {
    if (!window.confirm("Add test users to the database?")) return;
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
        fetchUsers();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to seed database");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u._id));
    }
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      minElo: "",
      maxElo: "",
      minRiskScore: "",
      maxRiskScore: "",
      isShadowBanned: "",
      isVerified: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setSearchQuery("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const filteredUsers = Array.isArray(users) ? users : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 min-h-screen">
      {/* Header Layer */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-center justify-center h-16 w-16 rounded-2xl bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(0,198,255,0.1)] backdrop-blur-md">
              <Shield className="h-8 w-8 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-5xl font-black prism-gradient-text tracking-tighter font-rajdhani uppercase drop-shadow-2xl">
                Tactical<span className="text-white">Operators</span>
              </h1>
              <p className="text-sm font-bold text-cyan-500/60 uppercase tracking-[0.3em] mt-1 pl-1">
                Registry & Clearance Management
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchUsers}
              className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 h-10 w-10 hover:text-cyan-400"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button className="rounded-xl px-6 h-10 bg-cyan-500 text-black font-black font-rajdhani uppercase tracking-widest hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">
              <UserCheck className="h-4 w-4 mr-2" />
              Enroll Operator
            </Button>
          </div>
        </div>
      </div>

      {/* Primary Statistics Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <div className="prism-card rounded-[2rem] p-6 relative group border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black text-cyan-400/60 uppercase tracking-[0.2em] font-rajdhani">Total Personnel</p>
            <Database className="h-4 w-4 text-cyan-400/40" />
          </div>
          <p className="text-4xl font-black text-white tracking-tighter tabular-nums font-rajdhani">
            {pagination.total || users.length}
          </p>
        </div>

        <div className="prism-card rounded-[2rem] p-6 relative group border-emerald-500/10 overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-[0.2em] font-rajdhani">Active Duty</p>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
          </div>
          <p className="text-4xl font-black text-emerald-400 tracking-tighter tabular-nums font-rajdhani drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            {users.filter((u) => u.status === "active").length}
          </p>
        </div>

        <div className="prism-card rounded-[2rem] p-6 relative group border-rose-500/10 overflow-hidden">
          <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black text-rose-400/60 uppercase tracking-[0.2em] font-rajdhani">Revoked Clearance</p>
            <Ban className="h-4 w-4 text-rose-400/40" />
          </div>
          <p className="text-4xl font-black text-rose-400 tracking-tighter tabular-nums font-rajdhani drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]">
            {users.filter((u) => u.status === "banned").length}
          </p>
        </div>

        <div className="prism-card rounded-[2rem] p-6 relative group border-blue-500/10 overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black text-blue-400/60 uppercase tracking-[0.2em] font-rajdhani">Selected Files</p>
            <div className="h-4 w-4 border-2 border-blue-400/40 rounded-sm" />
          </div>
          <p className="text-4xl font-black text-blue-400 tracking-tighter tabular-nums font-rajdhani drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
            {selectedUsers.length}
          </p>
        </div>
      </div>

      {/* Intelligence Terminal Area */}
      <div className="rounded-[2.5rem] prism-card border-white/5 overflow-hidden flex flex-col">
        {/* Terminal Header/Search */}
        <div className="px-8 pt-8 pb-6 border-b border-white/5 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400/40 group-focus-within:text-cyan-400 transition-colors" />
              <Input
                placeholder="Search profiles via Neuro-Link..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchUsers();
                }}
                className="pl-11 bg-white/[0.03] border-white/10 h-12 rounded-xl text-white placeholder:text-white/20 focus:border-cyan-500/50 focus:ring-cyan-500/10 transition-all font-mono text-xs uppercase"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "gap-2 border-white/10 rounded-xl h-12 px-6 bg-white/5 text-[10px] font-black uppercase tracking-widest font-rajdhani transition-all",
                  showFilters ? "border-cyan-500 text-cyan-400 bg-cyan-500/5" : "text-white/40 hover:text-white"
                )}
              >
                <Filter className="h-4 w-4" />
                Advanced Filters
              </Button>
              {(Object.values(filters).some((v) => v) || searchQuery) && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="gap-2 border-rose-500/20 rounded-xl h-12 px-6 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 text-[10px] font-black uppercase tracking-widest font-rajdhani transition-all"
                >
                  <X className="h-4 w-4" />
                  Reset System
                </Button>
              )}
            </div>
          </div>

          {/* Expanded Filters Layer */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-white/5 animate-in slide-in-from-top-4 duration-300">
              <Select value={filters.status} onValueChange={(val) => setFilters(p => ({ ...p, status: val }))}>
                <SelectTrigger className="bg-white/[0.03] border-white/10 h-10 rounded-xl text-[10px] font-black uppercase font-rajdhani text-white/70">
                  <SelectValue placeholder="Clearance Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A12] border-white/10">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Duty</SelectItem>
                  <SelectItem value="banned">Revoked</SelectItem>
                  <SelectItem value="inactive">MIA</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="MIN RATING"
                  value={filters.minElo}
                  onChange={(e) => setFilters(p => ({ ...p, minElo: e.target.value }))}
                  className="bg-white/[0.03] border-white/10 h-10 rounded-xl font-mono text-xs"
                />
                <Input
                  type="number"
                  placeholder="MAX RATING"
                  value={filters.maxElo}
                  onChange={(e) => setFilters(p => ({ ...p, maxElo: e.target.value }))}
                  className="bg-white/[0.03] border-white/10 h-10 rounded-xl font-mono text-xs"
                />
              </div>

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="MIN RISK %"
                  value={filters.minRiskScore}
                  onChange={(e) => setFilters(p => ({ ...p, minRiskScore: e.target.value }))}
                  className="bg-white/[0.03] border-white/10 h-10 rounded-xl font-mono text-xs"
                />
                <Input
                  type="number"
                  placeholder="MAX RISK %"
                  value={filters.maxRiskScore}
                  onChange={(e) => setFilters(p => ({ ...p, maxRiskScore: e.target.value }))}
                  className="bg-white/[0.03] border-white/10 h-10 rounded-xl font-mono text-xs"
                />
              </div>

              <Select value={filters.sortBy} onValueChange={(val) => setFilters(p => ({ ...p, sortBy: val }))}>
                <SelectTrigger className="bg-white/[0.03] border-white/10 h-10 rounded-xl text-[10px] font-black uppercase font-rajdhani text-white/70">
                  <SelectValue placeholder="Sort Protocol" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A12] border-white/10">
                  <SelectItem value="createdAt">Enrollment Date</SelectItem>
                  <SelectItem value="elo">Combat Rating</SelectItem>
                  <SelectItem value="fairPlayRiskScore">Risk Assessment</SelectItem>
                  <SelectItem value="username">Identifier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Bulk Action Strip */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-4 py-3 px-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 animate-in fade-in slide-in-from-left-4">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest font-rajdhani">
                {selectedUsers.length} Operators Selected
              </span>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkOperation("ban")}
                  className="h-8 text-[9px] font-black uppercase tracking-widest border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-rajdhani"
                >
                  <Ban className="h-3 w-3 mr-1" />
                  Revoke Clearance
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkOperation("shadowBan")}
                  className="h-8 text-[9px] font-black uppercase tracking-widest border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-rajdhani"
                >
                  Apply Shadow-Lock
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkOperation("verify")}
                  className="h-8 text-[9px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-rajdhani"
                >
                  Verify Authenticity
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkOperation("delete")}
                  className="h-8 text-[9px] font-black uppercase tracking-widest border-white/10 text-white/40 hover:bg-rose-500/10 hover:text-rose-400 font-rajdhani"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Erase Profile
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Intelligence Table Container */}
        <div className="relative flex-1 min-h-[500px]">
          {loading && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050510]/60 backdrop-blur-sm">
              <div className="h-16 w-16 relative">
                <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full animate-spin border-t-cyan-500" />
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-cyan-400" />
              </div>
              <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mt-6 animate-pulse font-rajdhani">
                Synchronizing Database...
              </p>
            </div>
          )}

          <div className="overflow-x-auto scrollbar-none">
            <Table>
              <TableHeader className="bg-white/[0.01]">
                <TableRow className="hover:bg-transparent border-b border-white/5">
                  <TableHead className="w-12 py-6 px-6">
                    <Checkbox
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onCheckedChange={toggleSelectAll}
                      className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                    />
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/50 py-6 px-4 font-rajdhani">
                    Personnel Identifier
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/50 font-rajdhani">
                    Combat Rating
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/50 font-rajdhani">
                    Missions
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/50 font-rajdhani">
                    W / L / D
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/50 font-rajdhani">
                    Risk Assessment
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/50 font-rajdhani">
                    Clearance
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/50 text-center font-rajdhani">
                    Status
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/50 text-right px-8 font-rajdhani">
                    Encryption
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-80 text-center border-none">
                      <div className="flex flex-col items-center justify-center space-y-6">
                        <div className="relative">
                          <Globe className="h-16 w-16 text-cyan-500/10 animate-[pulse_4s_ease-in-out_infinite]" />
                          <div className="absolute inset-0 bg-cyan-400/5 blur-2xl rounded-full" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-black text-cyan-400/40 uppercase tracking-[0.4em] font-rajdhani">
                            No Active Operators Detected
                          </p>
                          <p className="text-[10px] text-white/5 font-mono uppercase">
                            Perimeter scanning... [0/1024 sectors]
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleSeed}
                          className="gap-3 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 rounded-xl h-11 px-8 font-black uppercase tracking-widest text-[10px] font-rajdhani transition-all group shadow-[0_0_20px_rgba(0,198,255,0.05)] hover:shadow-[0_0_30px_rgba(0,198,255,0.1)]"
                        >
                          <Database className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          Initialize Recon Intel
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filteredUsers.map((user) => (
                  <TableRow
                    key={user._id}
                    className="group border-b border-white/[0.02] hover:bg-white/[0.03] transition-all duration-300"
                  >
                    <TableCell className="py-5 px-6">
                      <Checkbox
                        checked={selectedUsers.includes(user._id)}
                        onCheckedChange={() => toggleSelectUser(user._id)}
                        className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                      />
                    </TableCell>
                    <TableCell className="py-5 px-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-white/10 to-transparent p-[1px]">
                            <Avatar className="h-full w-full rounded-xl border border-white/5">
                              <AvatarFallback className="bg-[#0A0A12] text-cyan-400 text-xs font-black uppercase font-rajdhani">
                                {user.username.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div
                            className={cn(
                              "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#050510] shadow-[0_0_8px_rgba(0,0,0,0.5)]",
                              user.status === "active" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                            )}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-white text-sm font-rajdhani uppercase tracking-wide">
                              {user.username}
                            </p>
                            {user.isShadowBanned && (
                              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[8px] font-black uppercase tracking-widest px-2 h-4">
                                Ghost
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-white/20 mt-0.5 lowercase font-mono">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-base font-black text-white tabular-nums">
                          {user.elo}
                        </span>
                        <div className="text-[10px] font-black text-cyan-400/40 font-rajdhani uppercase ml-1 tracking-tighter">SIG</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-white/40 tabular-nums">
                      {user.games}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 text-[10px] font-black font-mono">
                        <span className="text-emerald-500">{user.wins}</span>
                        <span className="text-white/10">|</span>
                        <span className="text-rose-500">{user.losses}</span>
                        <span className="text-white/10">|</span>
                        <span className="text-white/40">{user.draws}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5 min-w-[100px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            "text-[9px] font-black uppercase font-rajdhani tracking-widest",
                            (user.fairPlayRiskScore || 0) < 30 ? "text-emerald-500" : (user.fairPlayRiskScore || 0) < 70 ? "text-amber-500" : "text-rose-500"
                          )}>
                            {(user.fairPlayRiskScore || 0) < 30 ? "Secure" : (user.fairPlayRiskScore || 0) < 70 ? "Unstable" : "Critical"}
                          </span>
                          <span className="text-[9px] font-bold font-mono text-white/30">{user.fairPlayRiskScore || 0}%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-1000",
                              (user.fairPlayRiskScore || 0) < 30 ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : (user.fairPlayRiskScore || 0) < 70 ? "bg-amber-500" : "bg-rose-500 shadow-[0_0_10px_#f43f5e]"
                            )}
                            style={{ width: `${user.fairPlayRiskScore || 0}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest border transition-all font-rajdhani",
                          user.role === "admin"
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                            : "bg-white/5 text-white/40 border-white/5"
                        )}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div
                        className={cn(
                          "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest font-rajdhani transition-all",
                          user.status === "active"
                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/5 border-rose-500/20 text-rose-400"
                        )}
                      >
                        {user.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10"
                          >
                            <MoreVertical className="h-4 w-4 text-white/40 group-hover:text-white" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#0A0A12] border-white/10 p-2 rounded-2xl shadow-2xl min-w-[200px] backdrop-blur-3xl animate-in zoom-in-95 duration-200"
                        >
                          <DropdownMenuItem
                            className="gap-3 cursor-pointer py-3 px-4 rounded-xl hover:bg-cyan-500/10 hover:text-cyan-400 transition-all text-[10px] font-black uppercase font-rajdhani tracking-widest"
                            onClick={() =>
                              toast.info(`Intelligence Report: ${user.username}`, {
                                description: `Risk Factor: ${user.fairPlayRiskScore || 0}% | Signal Integrity: ${user.averageAccuracy || 0}%`,
                              })
                            }
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Intelligence</span>
                          </DropdownMenuItem>

                          <div className="h-[1px] bg-white/5 my-2 mx-1" />

                          <DropdownMenuItem
                            className={cn(
                              "gap-3 cursor-pointer py-3 px-4 rounded-xl transition-all text-[10px] font-black uppercase font-rajdhani tracking-widest",
                              user.status === "banned"
                                ? "text-emerald-400 hover:bg-emerald-500/10"
                                : "text-amber-400 hover:bg-amber-500/10"
                            )}
                            onClick={() =>
                              updateUser(user._id, {
                                status: user.status === "banned" ? "active" : "banned",
                              })
                            }
                          >
                            <Ban className="h-4 w-4" />
                            <span>
                              {user.status === "banned" ? "Restore Clearance" : "Revoke Access"}
                            </span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className={cn(
                              "gap-3 cursor-pointer py-3 px-4 rounded-xl transition-all text-[10px] font-black uppercase font-rajdhani tracking-widest",
                              user.isShadowBanned
                                ? "text-emerald-400 hover:bg-emerald-500/10"
                                : "text-purple-400 hover:bg-purple-500/10"
                            )}
                            onClick={() =>
                              updateUser(user._id, {
                                isShadowBanned: !user.isShadowBanned,
                              })
                            }
                          >
                            <Shield className="h-4 w-4" />
                            <span>
                              {user.isShadowBanned ? "Lift Shadow Lock" : "Apply Shadow Lock"}
                            </span>
                          </DropdownMenuItem>

                          <div className="h-[1px] bg-white/5 my-2 mx-1" />

                          <DropdownMenuItem
                            className="gap-3 cursor-pointer py-3 px-4 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-all text-[10px] font-black uppercase font-rajdhani tracking-widest"
                            onClick={() => deleteUser(user._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Expunge Record</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Intelligence Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between p-8 border-t border-white/5 bg-white/[0.01]">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] font-rajdhani">
                Sector Map {pagination.page} of {pagination.pages} <span className="text-cyan-500/40 ml-2">[{pagination.total} ENTRIES]</span>
              </p>
              <div className="flex gap-3">
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
                  className="h-10 px-6 border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest font-rajdhani transition-all disabled:opacity-20"
                >
                  Previous Sector
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) pageNum = i + 1;
                    else if (pagination.page <= 3) pageNum = i + 1;
                    else if (pagination.page >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
                    else pageNum = pagination.page - 2 + i;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(p => ({ ...p, page: pageNum }))}
                        className={cn(
                          "w-10 h-10 rounded-xl transition-all font-mono text-[10px] font-bold border",
                          pagination.page === pageNum
                            ? "bg-cyan-500 border-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                            : "border-white/5 bg-white/5 text-white/40 hover:text-white hover:border-white/20"
                        )}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
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
                  className="h-10 px-6 border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest font-rajdhani transition-all disabled:opacity-20"
                >
                  Next Sector
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
