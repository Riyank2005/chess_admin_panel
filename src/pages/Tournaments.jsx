import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Trophy, Plus, Play, Pause, Users, Eye, Settings, Edit,
  Ban, Globe, Clock, ShieldCheck, ListOrdered,
  Share2, Zap, Target, FileDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default function Tournaments() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [editingTournamentId, setEditingTournamentId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [players, setPlayers] = useState([]);
  const [registeringPlayer, setRegisteringPlayer] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    timeControl: "10+0",
    maxPlayers: "64",
    prize: "",
    startTime: "",
    registrationEndDate: "",
  });

  useEffect(() => {
    fetchTournaments();
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch("/api/users?limit=100", {
        headers,
      });

      if (!response.ok) throw new Error("Failed to fetch players");

      const data = await response.json();
      setPlayers(data.users || []);
    } catch (error) {
      console.error("Fetch players error:", error);
    }
  };

  const handleExportReport = (tournament) => {
    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString();
      const primaryColor = [34, 211, 238]; // Cyan-400

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("NEXUS PRO: TACTICAL INTELLIGENCE", 15, 25);

      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`GEN_DATE: ${timestamp}`, 150, 25);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text("EVENT SPECIFICATION", 15, 55);
      doc.setLineWidth(0.5);
      doc.line(15, 58, 60, 58);

      doc.setFontSize(11);
      doc.text(`NAME: ${tournament.name}`, 15, 70);
      doc.text(`ID: ${(tournament._id || tournament.id || "N/A").toUpperCase()}`, 15, 78);
      doc.text(`FORMAT: ${tournament.timeControl}`, 15, 86);
      doc.text(`PRIZE POOL: ${tournament.prize}`, 15, 94);
      doc.text(`STATUS: ${tournament.status.toUpperCase()}`, 15, 102);

      doc.setFontSize(14);
      doc.text("OPERATOR STANDINGS", 15, 120);

      const tableData = (tournament.standings || []).map((p, idx) => [
        idx + 1,
        p.username,
        p.elo,
        p.points,
        `${((p.points / (tournament.totalRounds || 5)) * 100).toFixed(0)}%`
      ]);

      doc.autoTable({
        startY: 125,
        head: [['RANK', 'OPERATOR', 'ELO', 'SCORE', 'PRECISION']],
        body: tableData,
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 15, right: 15 }
      });

      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text("Confidential Tactical Data. Authorized Admin Personnel Only.", 15, finalY);

      doc.save(`NEXUS_REPORT_${tournament.name.replace(/\s+/g, '_')}.pdf`);
      toast.success("Tactical Report generated and downloaded.");
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Failed to generate report");
    }
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch("/api/tournaments", {
        headers,
      });

      if (!response.ok) throw new Error("Failed to fetch tournaments");

      const data = await response.json();
      setTournaments(data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (tournament) => {
    setSelectedTournament(tournament);
    setIsDetailsOpen(true);
  };

  const handleManualRegister = async () => {
    if (!registeringPlayer) {
      toast.error("Please select a player");
      return;
    }

    try {
      setIsRegistering(true);
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`/api/tournaments/${selectedTournament._id}/register`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          playerId: registeringPlayer,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || "Failed to register player";
        throw new Error(errorMessage);
      }

      const updatedTournament = await response.json();
      setSelectedTournament(updatedTournament);
      setTournaments(tournaments.map(t => t._id === updatedTournament._id ? updatedTournament : t));
      setRegisteringPlayer("");
      toast.success("Player registered successfully!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleKickPlayer = async (playerId, username) => {
    if (!window.confirm(`Are you sure you want to remove ${username} from this tournament?`)) return;

    try {
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`/api/tournaments/${selectedTournament._id}/register/${playerId}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove player");
      }

      const updatedTournament = await response.json();
      setSelectedTournament(updatedTournament);
      setTournaments(tournaments.map(t => t._id === updatedTournament._id ? updatedTournament : t));
      toast.success(`${username} has been removed from the mission.`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.prize) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: formData.name,
          timeControl: formData.timeControl,
          maxPlayers: parseInt(formData.maxPlayers),
          prize: formData.prize,
          startTime: formData.startTime,
          registrationEndDate: formData.registrationEndDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || "Failed to create tournament";
        throw new Error(errorMessage);
      }

      const newTournament = await response.json();
      setTournaments([newTournament, ...tournaments]);
      setIsCreateOpen(false);
      setFormData({ name: "", timeControl: "10+0", maxPlayers: "64", prize: "", startTime: "", registrationEndDate: "" });
      toast.success(`Tournament "${formData.name}" created successfully!`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditClick = (tournament) => {
    setEditingTournamentId(tournament._id || tournament.id);
    setFormData({
      name: tournament.name,
      timeControl: tournament.timeControl,
      maxPlayers: tournament.maxPlayers.toString(),
      prize: tournament.prize.replace('$', ''),
      startTime: tournament.startTime ? new Date(tournament.startTime).toISOString().slice(0, 16) : "",
      registrationEndDate: tournament.registrationEndDate ? new Date(tournament.registrationEndDate).toISOString().slice(0, 16) : "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!formData.name || !formData.prize) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`/api/tournaments/${editingTournamentId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: formData.name,
          timeControl: formData.timeControl,
          maxPlayers: parseInt(formData.maxPlayers),
          prize: formData.prize,
          startTime: formData.startTime,
          registrationEndDate: formData.registrationEndDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update tournament");
      }

      const updatedTournament = await response.json();
      setTournaments(tournaments.map(t => (t._id || t.id) === editingTournamentId ? updatedTournament : t));
      setIsEditOpen(false);
      setFormData({ name: "", timeControl: "10+0", maxPlayers: "64", prize: "", startTime: "", registrationEndDate: "" });
      toast.success(`Tournament updated successfully!`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleStatusChange = async (id, status, name) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`/api/tournaments/${id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      const updated = await response.json();
      setTournaments(tournaments.map(t => (t._id || t.id) === id ? updated : t));

      const action = status === 'registering' ? 'published' : status;
      toast.success(`Tournament ${name} is now ${action}!`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id, name) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`/api/tournaments/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) throw new Error("Failed to delete tournament");

      setTournaments(tournaments.filter((t) => (t._id || t.id) !== id));
      toast.error(`Tournament ${name} has been terminated.`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-1.5 bg-primary rounded-full"></div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Tournaments</h1>
              <p className="text-sm font-medium text-muted-foreground mt-1">Manage competitive events and prizes</p>
            </div>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl px-6 h-12 bg-primary text-primary-foreground font-bold hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Tournament
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 rounded-3xl p-8 max-w-lg outline-none overflow-hidden sm:rounded-[2rem]">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-bold text-white">New Tournament</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tournament Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter name..."
                    className="h-12 rounded-xl bg-white/[0.03] border-white/5 text-white focus:ring-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Time Control</Label>
                    <Select
                      value={formData.timeControl}
                      onValueChange={(value) => setFormData({ ...formData, timeControl: value })}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-white/[0.03] border-white/5 text-white focus:ring-primary/20">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-white rounded-xl">
                        <SelectItem value="1+0">Bullet</SelectItem>
                        <SelectItem value="3+0">Blitz</SelectItem>
                        <SelectItem value="10+0">Rapid</SelectItem>
                        <SelectItem value="30+0">Classical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max Players</Label>
                    <Select
                      value={formData.maxPlayers}
                      onValueChange={(value) => setFormData({ ...formData, maxPlayers: value })}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-white/[0.03] border-white/5 text-white focus:ring-primary/20">
                        <SelectValue placeholder="Limit" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-white rounded-xl">
                        <SelectItem value="16">16 Players</SelectItem>
                        <SelectItem value="64">64 Players</SelectItem>
                        <SelectItem value="128">128 Players</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prize Pool</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">$</span>
                    <Input
                      value={formData.prize}
                      onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                      placeholder="0.00"
                      className="h-12 pl-8 rounded-xl bg-white/[0.03] border-white/5 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reg. End Date</Label>
                    <Input
                      type="datetime-local"
                      value={formData.registrationEndDate}
                      onChange={(e) => setFormData({ ...formData, registrationEndDate: e.target.value })}
                      className="h-12 rounded-xl bg-white/[0.03] border-white/5 text-white focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="h-12 rounded-xl bg-white/[0.03] border-white/5 text-white focus:ring-primary/20"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreate}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold mt-4 hover:bg-primary/90"
                >
                  Create Tournament
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Tournament Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="bg-card border-white/10 rounded-3xl p-8 max-w-lg outline-none overflow-hidden sm:rounded-[2rem]">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-bold text-white">Edit Tournament</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tournament Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter name..."
                    className="h-12 rounded-xl bg-white/[0.03] border-white/5 text-white focus:ring-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Time Control</Label>
                    <Select
                      value={formData.timeControl}
                      onValueChange={(value) => setFormData({ ...formData, timeControl: value })}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-white/[0.03] border-white/5 text-white focus:ring-primary/20">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-white rounded-xl">
                        <SelectItem value="1+0">Bullet</SelectItem>
                        <SelectItem value="3+0">Blitz</SelectItem>
                        <SelectItem value="10+0">Rapid</SelectItem>
                        <SelectItem value="30+0">Classical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max Players</Label>
                    <Select
                      value={formData.maxPlayers}
                      onValueChange={(value) => setFormData({ ...formData, maxPlayers: value })}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-white/[0.03] border-white/5 text-white focus:ring-primary/20">
                        <SelectValue placeholder="Limit" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-white rounded-xl">
                        <SelectItem value="16">16 Players</SelectItem>
                        <SelectItem value="64">64 Players</SelectItem>
                        <SelectItem value="128">128 Players</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prize Pool</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">$</span>
                    <Input
                      value={formData.prize}
                      onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                      placeholder="0.00"
                      className="h-12 pl-8 rounded-xl bg-white/[0.03] border-white/5 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reg. End Date</Label>
                    <Input
                      type="datetime-local"
                      value={formData.registrationEndDate}
                      onChange={(e) => setFormData({ ...formData, registrationEndDate: e.target.value })}
                      className="h-12 rounded-xl bg-white/[0.03] border-white/5 text-white focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="h-12 rounded-xl bg-white/[0.03] border-white/5 text-white focus:ring-primary/20"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleUpdate}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold mt-4 hover:bg-primary/90"
                >
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
        <div className="rounded-[2rem] p-6 border border-white/5 bg-white/[0.02] backdrop-blur-md relative overflow-hidden group">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Tournaments</p>
          <p className="text-3xl font-bold text-white mt-4 tracking-tight tabular-nums">
            {loading ? "..." : tournaments.length}
          </p>
        </div>
        <div className="rounded-[2rem] p-6 border border-white/5 bg-white/[0.02] backdrop-blur-md relative overflow-hidden group">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Now</p>
          <p className="text-3xl font-bold text-emerald-400 mt-4 tracking-tight tabular-nums">
            {loading ? "..." : tournaments.filter(t => t.status === "live").length}
          </p>
        </div>
        <div className="rounded-[2rem] p-6 border border-white/5 bg-white/[0.02] backdrop-blur-md relative overflow-hidden group">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Registering</p>
          <p className="text-3xl font-bold text-blue-400 mt-4 tracking-tight tabular-nums">
            {loading ? "..." : tournaments.filter(t => t.status === "registering").length}
          </p>
        </div>
        <div className="rounded-[2rem] p-6 border border-white/5 bg-white/[0.02] backdrop-blur-md relative overflow-hidden group">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Prize Pool</p>
          <p className="text-3xl font-bold text-primary mt-4 tracking-tight tabular-nums">
            ${loading ? "..." : tournaments.reduce((sum, t) => sum + parseInt(t.prize?.replace(/\$|,/g, '') || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-md overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto scrollbar-none">
          <Table>
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="hover:bg-transparent border-b border-white/5">
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-6 px-6">ID</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Format</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Players</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prize</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Status</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-medium">
                    Tactical data retrieval in progress...
                  </TableCell>
                </TableRow>
              ) : tournaments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-medium">
                    No active tournaments found. Initialize new event to begin.
                  </TableCell>
                </TableRow>
              ) : (
                tournaments.map((tournament) => (
                  <TableRow key={tournament._id || tournament.id} className="group border-b border-white/[0.02] hover:bg-white/[0.03] transition-all duration-300">
                    <TableCell className="py-4 px-6 whitespace-nowrap">
                      <span className="font-mono text-xs text-muted-foreground font-bold">
                        {(tournament._id || tournament.id).substring(0, 8).toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{tournament.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {new Date(tournament.startTime).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold border-white/10 bg-white/5 text-muted-foreground rounded-md px-2 py-1 uppercase tracking-wider font-mono">
                        {tournament.timeControl}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-muted-foreground h-3.5 w-3.5 mr-1" />
                        <span className="text-sm font-bold text-white tabular-nums">
                          {tournament.players || 0}
                          <span className="text-muted-foreground/40 mx-1">/</span>
                          {tournament.maxPlayers}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-primary text-sm tabular-nums tracking-tight">{tournament.prize}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border",
                          tournament.status === "live"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : tournament.status === "registering"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : tournament.status === "draft"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-white/5 text-muted-foreground border-white/5"
                        )}
                      >
                        {tournament.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg transition-all"
                          onClick={() => handleView(tournament)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

                        {tournament.status === "draft" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-amber-400 hover:bg-white/10 rounded-lg transition-all"
                            onClick={() => handleStatusChange(tournament._id || tournament.id, 'registering', tournament.name)}
                            title="Publish Tournament"
                          >
                            <Globe className="h-3.5 w-3.5" />
                          </Button>
                        ) : tournament.status === "live" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-amber-400 hover:bg-white/10 rounded-lg transition-all"
                            onClick={() => toast.warning(`${tournament.name} restricted. Pausing rounds...`)}
                          >
                            <Pause className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-emerald-400 hover:bg-white/10 rounded-lg transition-all"
                            onClick={() => toast.success(`${tournament.name} will start soon.`)}
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg transition-all"
                          onClick={() => {
                            toast.info(`Configuring ${tournament.name}...`);
                            navigate("/settings");
                          }}
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-blue-400 hover:bg-white/10 rounded-lg transition-all"
                          onClick={() => handleEditClick(tournament)}
                          title="Edit Details"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          onClick={() => handleDelete(tournament._id || tournament.id, tournament.name)}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Tournament Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-white/10 rounded-[2.5rem] p-0 max-w-4xl outline-none overflow-hidden h-[85vh] flex flex-col">
          {selectedTournament && (
            <div className="flex flex-col h-full">
              {/* Modal Header */}
              <div className="relative p-8 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-b border-white/5 flex-shrink-0">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Trophy className="h-32 w-32 rotate-12" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className="bg-primary/20 text-primary border-primary/20 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest">
                      ID: {(selectedTournament._id || selectedTournament.id || "ID-MISSING").toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5 uppercase text-[10px] font-bold px-3 py-1">
                      {selectedTournament.status}
                    </Badge>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase font-mono">
                        {selectedTournament.name}
                      </h2>
                      <div className="flex items-center gap-6 text-muted-foreground mt-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-white tracking-tight">{new Date(selectedTournament.startTime).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-white tabular-nums">
                            {selectedTournament.players || 0} / {selectedTournament.maxPlayers} Registered
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="h-12 border-white/5 bg-white/5 text-white hover:bg-white/10 rounded-xl px-6 font-bold"
                        onClick={() => handleExportReport(selectedTournament)}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Export Intelligence
                      </Button>
                      <Button className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                        <Play className="h-4 w-4 mr-2 fill-current" />
                        Initialize Rounds
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Content with Tabs */}
              <Tabs defaultValue="leaderboard" className="flex-1 flex flex-col min-h-0">
                <div className="px-8 border-b border-white/5 bg-white/[0.01]">
                  <TabsList className="bg-transparent h-14 w-full justify-start gap-8 p-0">
                    <TabsTrigger value="overview" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-white text-muted-foreground text-xs font-bold uppercase tracking-[0.2em]">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="participants" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-white text-muted-foreground text-xs font-bold uppercase tracking-[0.2em]">
                      Participants
                    </TabsTrigger>
                    <TabsTrigger value="leaderboard" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-white text-muted-foreground text-xs font-bold uppercase tracking-[0.2em]">
                      Standings
                    </TabsTrigger>
                    <TabsTrigger value="bracket" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-white text-muted-foreground text-xs font-bold uppercase tracking-[0.2em]">
                      Tactical Brackets
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <TabsContent value="overview" className="mt-0 space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-4 gap-6">
                      <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex flex-col gap-2">
                        <Zap className="h-5 w-5 text-primary mb-2" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Format</span>
                        <span className="text-xl font-black text-white font-mono">{selectedTournament.timeControl}</span>
                      </div>
                      <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex flex-col gap-2">
                        <Target className="h-5 w-5 text-primary mb-2" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Prize Pool</span>
                        <span className="text-xl font-black text-primary font-mono">{selectedTournament.prize}</span>
                      </div>
                      <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex flex-col gap-2">
                        <Clock className="h-5 w-5 text-primary mb-2" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Reg. Ends</span>
                        <span className="text-xs font-bold text-white font-mono">{selectedTournament.registrationEndDate ? new Date(selectedTournament.registrationEndDate).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex flex-col gap-2">
                        <Globe className="h-5 w-5 text-primary mb-2" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Status</span>
                        <span className="text-xl font-black text-white font-mono uppercase">{selectedTournament.status}</span>
                      </div>
                    </div>

                    <div className="space-y-4 bg-white/[0.02] border border-white/5 rounded-[2rem] p-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                          <ShieldCheck className="h-5 w-5 text-primary" />
                          Progression Status
                        </h3>
                        <Badge className="bg-primary/20 text-primary uppercase text-[10px] font-bold px-4 py-1 tracking-widest">
                          Round {selectedTournament.currentRound || 0} / {selectedTournament.totalRounds || 5}
                        </Badge>
                      </div>
                      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <div
                          className="h-full bg-primary transition-all duration-1000 rounded-full shadow-[0_0_20px_rgba(var(--primary),0.5)]"
                          style={{ width: `${((selectedTournament.currentRound / (selectedTournament.totalRounds || 5)) * 100) || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground/60 font-medium leading-relaxed mt-4 italic">
                        Current tactical mission is in {selectedTournament.status} state. Round {selectedTournament.currentRound || 0} analysis and pairings are active. Ensure all operators are online for sync.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="participants" className="mt-0 space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-end gap-4 p-6 bg-white/[0.03] border border-white/5 rounded-3xl">
                      <div className="flex-1 space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Manual Enrollment Protocol</Label>
                        <Select
                          value={registeringPlayer}
                          onValueChange={setRegisteringPlayer}
                        >
                          <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl text-white">
                            <SelectValue placeholder="Select operator to enroll..." />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-white/10 text-white max-h-60">
                            {players.map(p => (
                              <SelectItem key={p._id} value={p._id}>
                                {p.username} (ELO: {p.elo})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleManualRegister}
                        disabled={isRegistering}
                        className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                      >
                        {isRegistering ? "Enrolling..." : "Enroll Operator"}
                      </Button>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden">
                      <Table>
                        <TableHeader className="bg-white/5">
                          <TableRow className="border-b border-white/10 hover:bg-transparent">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 pl-8">Operator</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ELO Rating</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right pr-8">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(!selectedTournament.enrolledPlayers || selectedTournament.enrolledPlayers.length === 0) ? (
                            <TableRow>
                              <TableCell colSpan={4} className="h-32 text-center text-muted-foreground font-medium italic">
                                No operators currently enrolled in this mission.
                              </TableCell>
                            </TableRow>
                          ) : (
                            selectedTournament.enrolledPlayers.map((player, idx) => (
                              <TableRow key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.05] transition-colors">
                                <TableCell className="pl-8 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                      {player.username?.[0] || "?"}
                                    </div>
                                    <span className="font-bold text-white text-sm">{player.username}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">{player.elo}</TableCell>
                                <TableCell>
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] font-black uppercase px-2">Ready</Badge>
                                </TableCell>
                                <TableCell className="text-right pr-8">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                                    onClick={() => handleKickPlayer(player.player, player.username)}
                                  >
                                    <Ban className="h-3.5 w-3.5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="leaderboard" className="mt-0 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden">
                      <Table>
                        <TableHeader className="bg-white/5">
                          <TableRow className="border-b border-white/10 hover:bg-transparent">
                            <TableHead className="w-16 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Rank</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operator</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ELO</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Score</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right pr-8">Performance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(!selectedTournament.enrolledPlayers || selectedTournament.enrolledPlayers.length === 0) ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-medium italic">
                                Mission in progress. Waiting for initial tactical sync.
                              </TableCell>
                            </TableRow>
                          ) : (
                            selectedTournament.enrolledPlayers.map((player, idx) => (
                              <TableRow key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.05] transition-colors group">
                                <TableCell className="text-center font-black text-sm py-4">
                                  <span className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center mx-auto",
                                    idx === 0 ? "bg-amber-400/10 text-amber-400 border border-amber-400/20" :
                                      idx === 1 ? "bg-slate-400/10 text-slate-400 border border-slate-400/20" :
                                        idx === 2 ? "bg-amber-700/10 text-amber-700 border border-amber-700/20" :
                                          "text-muted-foreground"
                                  )}>
                                    {idx + 1}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-transparent border border-white/10 flex items-center justify-center text-[10px] font-bold">
                                      {player.username?.[0] || "?"}
                                    </div>
                                    <span className="font-bold text-white text-sm tracking-tight">{player.username}</span>
                                    {idx === 0 && <Trophy className="h-3 w-3 text-amber-400" />}
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">{player.elo}</TableCell>
                                <TableCell className="text-center">
                                  <span className="font-black text-primary text-base tabular-nums">{player.points}</span>
                                </TableCell>
                                <TableCell className="text-right pr-8">
                                  <div className="flex items-center justify-end gap-1">
                                    {[1, 2, 3, 4, 5].map((m) => (
                                      <div key={m} className={cn(
                                        "w-2.5 h-2.5 rounded-sm border",
                                        m <= player.points ? "bg-emerald-500/40 border-emerald-500/40" :
                                          m === Math.ceil(player.points) && player.points % 1 !== 0 ? "bg-amber-500/40 border-amber-500/40" :
                                            "bg-white/5 border-white/10"
                                      )} />
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="bracket" className="mt-0 animate-in slide-in-from-bottom-2 duration-500 h-full">
                    <div className="p-8 bg-white/[0.03] border border-white/5 rounded-[2rem] min-h-[400px] flex flex-col items-center justify-center gap-8 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.05)_0%,transparent_70%)]" />

                      <div className="flex justify-around w-full relative z-10">
                        <div className="space-y-24">
                          {[1, 2].map(b => (
                            <div key={b} className="relative">
                              <div className="w-56 bg-card border border-white/10 rounded-xl p-3 space-y-2 shadow-2xl">
                                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                                  <span className="text-xs font-bold text-white">Magnus_C</span>
                                  <span className="text-xs font-black text-emerald-400">1</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-transparent rounded-lg border border-white/5 opacity-40">
                                  <span className="text-xs font-bold text-white">Hikaru_N</span>
                                  <span className="text-xs font-black text-rose-500">0</span>
                                </div>
                              </div>
                              <div className="absolute left-full top-1/2 w-8 h-[2px] bg-white/10" />
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center">
                          <div className="relative">
                            <div className="absolute right-full top-0 w-8 h-[calc(50%+40px)] border-r-2 border-t-2 border-white/10 rounded-tr-2xl" />
                            <div className="absolute right-full bottom-0 w-8 h-[calc(50%+40px)] border-r-2 border-b-2 border-white/10 rounded-br-2xl" />

                            <div className="w-64 bg-primary/10 border-2 border-primary/20 rounded-2xl p-4 shadow-[0_0_30px_rgba(var(--primary),0.1)]">
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge className="bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-widest px-3 py-0.5">Grand Final</Badge>
                              </div>
                              <div className="space-y-3 mt-2">
                                <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl border border-white/10">
                                  <div className="flex items-center gap-3">
                                    <Trophy className="h-4 w-4 text-amber-400" />
                                    <span className="text-sm font-black text-white">Magnus_C</span>
                                  </div>
                                  <span className="text-sm font-black text-white">--</span>
                                </div>
                                <div className="text-center text-[10px] font-black text-muted-foreground/40 italic">VS</div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 opacity-60">
                                  <div className="flex items-center gap-3">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-black text-white">Winner S2</span>
                                  </div>
                                  <span className="text-sm font-black text-white">--</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-24">
                          {[3, 4].map(b => (
                            <div key={b} className="relative">
                              <div className="absolute right-full top-1/2 w-8 h-[2px] bg-white/10" />
                              <div className="w-56 bg-card border border-white/10 rounded-xl p-3 space-y-2 shadow-2xl">
                                <div className="flex items-center justify-between p-2 bg-transparent rounded-lg border border-white/5 opacity-40">
                                  <span className="text-xs font-bold text-white">Pragg_R</span>
                                  <span className="text-xs font-black text-muted-foreground">0.5</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                                  <span className="text-xs font-bold text-white">Gukesh_D</span>
                                  <span className="text-xs font-black text-amber-500">0.5*</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>

                <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3 flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsOpen(false)}
                    className="h-12 border-white/10 text-white rounded-xl px-8 hover:bg-white/5"
                  >
                    Close Command View
                  </Button>
                  <Button
                    onClick={() => {
                      toast.success(`Broadcasting update to all participants of ${selectedTournament.name}...`);
                    }}
                    className="h-12 rounded-xl bg-white/5 border border-white/10 text-white px-8 hover:bg-white/10"
                  >
                    Global Broadcast
                  </Button>
                  <Button
                    onClick={() => {
                      toast.success(`Entering ${selectedTournament.name} Arena...`);
                      navigate("/games");
                    }}
                    className="h-12 rounded-xl bg-primary text-primary-foreground font-bold px-8 hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all"
                  >
                    Enter Command Arena
                  </Button>
                </div>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
