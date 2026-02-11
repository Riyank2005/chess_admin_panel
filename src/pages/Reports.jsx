import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertTriangle,
  ShieldAlert,
  History,
  Terminal,
  RefreshCw,
  Download,
  X,
  Loader2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "",
    adminName: "",
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
  const [userReports] = useState([
    {
      id: "REP_001",
      reporter: "Magnus_C",
      reported: "Cheater123",
      reason: "Engine use",
      status: "pending",
      date: "2024-01-20",
    },
    {
      id: "REP_002",
      reporter: "Hikaru_N",
      reported: "ToxicPlayer",
      reason: "Harassment",
      status: "pending",
      date: "2024-01-20",
    },
    {
      id: "REP_003",
      reporter: "Ding_L",
      reported: "Spammer99",
      reason: "Spam",
      status: "reviewed",
      date: "2024-01-19",
    },
    {
      id: "REP_004",
      reporter: "Ian_N",
      reported: "BadSport",
      reason: "Stalling",
      status: "resolved",
      date: "2024-01-18",
    },
  ]);

  useEffect(() => {
    fetchAuditLogs();
  }, [filters, pagination.page]);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("adminName", searchQuery);
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "") params.append(key, value);
    });
    params.append("page", pagination.page.toString());
    params.append("limit", pagination.limit.toString());
    return params.toString();
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const queryString = buildQueryParams();
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/audit?${queryString}`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Security Sync Failed: ${response.status}`);
      }
      const data = await response.json();
      setAuditLogs(Array.isArray(data.logs) ? data.logs : []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error(`Terminal Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportAuditLogs = async () => {
    try {
      const queryString = buildQueryParams();
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/audit/export?${queryString}`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export API Error:', response.status, errorText);
        throw new Error(`Export failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Audit logs exported successfully");
    } catch (err) {
      console.error('Export error:', err);
      toast.error(`Export failed: ${err.message}`);
    }
  };

  const exportAuditLogsPDF = () => {
    try {
      const doc = new jsPDF();

      // Add Title
      doc.setFontSize(22);
      doc.setTextColor(6, 182, 212); // Cyan 500
      doc.text("ChessMaster Security Audit Report", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Total Records: ${auditLogs.length}`, 14, 35);

      const tableData = auditLogs.map(log => [
        log._id.slice(-6),
        log.adminName || "System",
        log.action,
        log.target,
        log.details || "—",
        new Date(log.createdAt).toLocaleString()
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['Log ID', 'Arbiter', 'Action', 'Node Target', 'Details', 'Temporal Mark']],
        body: tableData,
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 8 },
        margin: { top: 45 }
      });

      doc.save(`security_audit_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Security PDF generated successfully");
    } catch (err) {
      console.error('PDF Export error:', err);
      toast.error(`PDF Export failed: ${err.message}`);
    }
  };

  const clearFilters = () => {
    setFilters({
      action: "",
      adminName: "",
      dateFrom: "",
      dateTo: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setSearchQuery("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "reviewed":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "resolved":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default:
        return "bg-white/5 text-white/30 border-white/10";
    }
  };

  const getActionBadgeColor = (action) => {
    const colors = {
      BAN: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      UNBAN: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      SHADOW_BAN: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      DELETE_USER: "bg-red-500/10 text-red-500 border-red-500/20",
      GAME_TERMINATED: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      SYSTEM_KILLSWITCH: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      BROADCAST: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      SETTINGS_UPDATE: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    };
    return colors[action] || "bg-white/5 text-white/30 border-white/10";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-2 bg-primary rounded-full shadow-[0_0_20px_rgba(255,215,0,0.4)]"></div>
            <div>
              <h1 className="text-4xl font-black prism-gradient-text tracking-tighter uppercase font-outfit leading-none">
                Security Bureau
              </h1>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-2">
                Arbiter Control // Conduct Logs
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={exportAuditLogs}
              className="gap-2 border-white/10 rounded-xl bg-white/5 text-white/60 hover:text-white h-12 px-6"
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={exportAuditLogsPDF}
              className="gap-2 border-white/10 rounded-xl bg-white/5 text-white/60 hover:text-white h-12 px-6"
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchAuditLogs}
              className="rounded-full border-white/10 bg-white/5 hover:bg-white/10"
            >
              <RefreshCw className={loading ? "animate-spin h-4 w-4" : "h-4 w-4"} />
            </Button>
          </div>
        </div>
      </div>

      {/* Bureau Stats */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
        <div className="prism-card rounded-3xl p-6 border-white/5 relative overflow-hidden group">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
            Total Logs
          </p>
          <p className="text-4xl font-black text-white mt-4 tracking-tighter tabular-nums">
            {pagination.total || auditLogs.length}
          </p>
        </div>
        <div className="prism-card rounded-3xl p-6 border-white/5 relative overflow-hidden group">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
            Pending Alerts
          </p>
          <p className="text-4xl font-black text-amber-500 mt-4 tracking-tighter tabular-nums">
            {userReports.filter((r) => r.status === "pending").length}
          </p>
        </div>
        <div className="prism-card rounded-3xl p-6 border-white/5 relative overflow-hidden group">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
            Bans Dispatched
          </p>
          <p className="text-4xl font-black text-rose-500 mt-4 tracking-tighter tabular-nums">
            {auditLogs.filter((l) => l.action === "BAN").length}
          </p>
        </div>
        <div className="prism-card rounded-3xl p-6 border-white/5 relative overflow-hidden group">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
            Today's Activity
          </p>
          <p className="text-4xl font-black text-blue-400 mt-4 tracking-tighter tabular-nums">
            {
              auditLogs.filter(
                (l) =>
                  new Date(l.createdAt).toDateString() === new Date().toDateString()
              ).length
            }
          </p>
        </div>
      </div>

      {/* Main Agency Control */}
      <div className="prism-card rounded-[3rem] border-white/5 overflow-hidden">
        <Tabs defaultValue="audit" className="w-full">
          <div className="px-8 pt-8 pb-4 border-b border-white/5 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white/[0.01]">
            <TabsList className="bg-white/5 border border-white/10 rounded-2xl h-14 p-1.5 gap-1">
              <TabsTrigger
                value="users"
                className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-black transition-all"
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-2" />
                Conduct Reports
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-black transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-2" />
                Intercom Review
              </TabsTrigger>
              <TabsTrigger
                value="audit"
                className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-black transition-all"
              >
                <Terminal className="w-3.5 h-3.5 mr-2" />
                Audit Stream
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                <Input
                  placeholder="Search Admin Name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setFilters((prev) => ({ ...prev, adminName: e.target.value }));
                  }}
                  className="pl-11 bg-white/[0.03] border-white/5 h-12 rounded-2xl text-white placeholder:text-white/10 focus:ring-primary/20"
                />
              </div>
              {(Object.values(filters).some((v) => v) || searchQuery) && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  size="icon"
                  className="h-12 w-12 border-white/10 bg-white/5"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="px-8 py-4 border-b border-white/5 bg-white/[0.01] flex flex-wrap gap-4">
            <Select
              value={filters.action}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, action: value }))
              }
            >
              <SelectTrigger className="bg-white/[0.03] border-white/5 h-10 rounded-xl w-[180px]">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="BAN">Ban</SelectItem>
                <SelectItem value="UNBAN">Unban</SelectItem>
                <SelectItem value="SHADOW_BAN">Shadow Ban</SelectItem>
                <SelectItem value="DELETE_USER">Delete User</SelectItem>
                <SelectItem value="GAME_TERMINATED">Game Terminated</SelectItem>
                <SelectItem value="SYSTEM_KILLSWITCH">System Killswitch</SelectItem>
                <SelectItem value="BROADCAST">Broadcast</SelectItem>
                <SelectItem value="SETTINGS_UPDATE">Settings Update</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From Date"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
              }
              className="bg-white/[0.03] border-white/5 h-10 rounded-xl w-[160px]"
            />

            <Input
              type="date"
              placeholder="To Date"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
              }
              className="bg-white/[0.03] border-white/5 h-10 rounded-xl w-[160px]"
            />

            <Select
              value={filters.sortOrder}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, sortOrder: value }))
              }
            >
              <SelectTrigger className="bg-white/[0.03] border-white/5 h-10 rounded-xl w-[140px]">
                <SelectValue placeholder="Sort Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="users" className="p-0 animate-in fade-in duration-500">
            <div className="overflow-x-auto scrollbar-none">
              <Table>
                <TableHeader className="bg-white/[0.01]">
                  <TableRow className="hover:bg-transparent border-b border-white/5">
                    <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 py-8 px-8">
                      Dispatch_ID
                    </TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                      Source
                    </TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                      Subject
                    </TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                      Violation
                    </TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                      Status
                    </TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 text-right px-10">
                      Protocols
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userReports.map((report) => (
                    <TableRow
                      key={report.id}
                      className="group border-b border-white/[0.02] hover:bg-white/[0.03] transition-all duration-500"
                    >
                      <TableCell className="py-6 px-8">
                        <span className="font-mono text-[10px] bg-white/[0.03] text-white/30 px-3 py-1.5 rounded-lg border border-white/5 font-black uppercase tracking-tighter">
                          {report.id}
                        </span>
                      </TableCell>
                      <TableCell className="font-black text-white/80 uppercase text-xs tracking-tighter">
                        {report.reporter}
                      </TableCell>
                      <TableCell className="font-black text-rose-500 uppercase text-xs tracking-tighter">
                        {report.reported}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-rose-500/10 bg-rose-500/5 text-rose-500/60 text-[9px] font-black uppercase tracking-widest px-2 py-1"
                        >
                          {report.reason}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest border",
                            renderStatusBadge(report.status)
                          )}
                        >
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-10 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-20 group-hover:opacity-100 transition-all duration-500">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-white/30 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-white/30 hover:text-emerald-500 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-white/10 hover:text-rose-500 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/20"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="p-10 animate-in fade-in duration-500">
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <div className="h-20 w-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <MessageSquare className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                  Intercom Surveillance
                </h3>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2 max-w-sm mx-auto leading-relaxed">
                  Automated Scrutiny is currently scanning all active comms nodes for policy
                  violations.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6 w-full max-w-xl">
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3">
                    Filtered
                  </p>
                  <p className="text-2xl font-black text-white tabular-nums">1.2K</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3">
                    Queue
                  </p>
                  <p className="text-2xl font-black text-amber-500 tabular-nums">23</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3">
                    Silent
                  </p>
                  <p className="text-2xl font-black text-rose-500 tabular-nums">45</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="p-0 animate-in fade-in duration-500">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            )}
            <div className="overflow-x-auto scrollbar-none">
              <Table>
                <TableHeader className="bg-white/[0.01]">
                  <TableRow className="hover:bg-transparent border-b border-white/5">
                    <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 py-8 px-8">
                      Log_Entry
                    </TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                      Arbiter
                    </TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                      Terminal_Action
                    </TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                      Node_Target
                    </TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                      Details
                    </TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 text-right px-10">
                      Temporal_Mark
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!loading && auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <History className="h-12 w-12 text-white/5 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                          No Temporal Records Found
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow
                        key={log._id}
                        className="group border-b border-white/[0.02] hover:bg-white/[0.03] transition-all duration-500"
                      >
                        <TableCell className="py-6 px-8 font-mono text-[10px] text-white/30 font-black tracking-widest uppercase">
                          {log._id.slice(-6)}
                        </TableCell>
                        <TableCell className="font-black text-white/80 uppercase text-xs tracking-tighter">
                          {log.adminName || "System"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest border",
                              getActionBadgeColor(log.action)
                            )}
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[10px] text-white/40 uppercase font-black">
                          {log.target}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest truncate max-w-[200px]">
                              {log.details || "—"}
                            </span>
                            {log.ipAddress && (
                              <span className="text-[8px] font-mono text-white/20">
                                IP: {log.ipAddress}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-10 font-mono text-[10px] text-white/20 uppercase whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between p-6 border-t border-white/5">
                <p className="text-xs font-black text-white/40 uppercase tracking-widest">
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
                    className="h-8 px-4 border-white/10 bg-white/5"
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
                    className="h-8 px-4 border-white/10 bg-white/5"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
