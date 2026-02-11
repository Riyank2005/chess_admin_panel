import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, AlertCircle, CheckCircle, Ban, MessageCircle } from "lucide-react";

const getActivityColor = (activity) => {
  const colors = {
    HIGH: "bg-green-500/10 text-green-700",
    MEDIUM: "bg-blue-500/10 text-blue-700",
    LOW: "bg-yellow-500/10 text-yellow-500",
    INACTIVE: "bg-red-500/10 text-red-700"
  };
  return colors[activity] || "bg-gray-500/10 text-gray-700";
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activityFilter, setActivityFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, activityFilter, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
        ...(activityFilter && { activity: activityFilter }),
        page
      });

      const url = `/api/users/management?${params}`;
      console.log('Fetching from:', url);

      const token = localStorage.getItem('token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url, { headers });
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch users (Status: ${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('Fetched users:', data);

      setUsers(data.users || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(error.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Bulk Actions
  const handleBulkBan = async () => {
    if (selectedUsers.length === 0) return;

    const reason = window.prompt("Enter ban reason for selected users:");
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { "Content-Type": "application/json" };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch("/api/users/management/bulk-ban", {
        method: "POST",
        headers,
        body: JSON.stringify({ userIds: selectedUsers, reason })
      });

      if (!response.ok) throw new Error("Failed to ban users");
      toast.success(`Banned ${selectedUsers.length} users`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleBulkWarn = async () => {
    if (selectedUsers.length === 0) return;

    const reason = window.prompt("Enter warning reason for selected users:");
    if (!reason) return;

    try {
      const response = await fetch("/api/users/management/bulk-warn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUsers, reason })
      });

      if (!response.ok) throw new Error("Failed to warn users");
      toast.success(`Warned ${selectedUsers.length} users`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const exportUsersCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("/api/users/export", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to export users (Status: ${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Users exported successfully");
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message);
    }
  };

  // User Actions
  const handleWarnUser = async (userId, username) => {
    const reason = prompt(`Warning reason for ${username}:`);
    if (!reason) return;

    try {
      const response = await fetch("/api/users/management/warn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reason })
      });

      if (!response.ok) throw new Error("Failed to warn user");
      toast.success(`${username} has been warned`);
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleBanUser = async (userId, username) => {
    const reason = prompt(`Ban reason for ${username}:`);
    if (!reason) return;

    try {
      const response = await fetch("/api/users/management/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reason })
      });

      if (!response.ok) throw new Error("Failed to ban user");
      toast.success(`${username} has been banned`);
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Selection Management
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id || user.id));
    }
  };

  // Filter Management
  const clearFilters = () => {
    setStatusFilter("");
    setActivityFilter("");
    setSearchQuery("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-muted-foreground mt-2">Manage and monitor all platform users</p>
        </div>
        <Button onClick={exportUsersCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          placeholder="Search users by username or email..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="bg-white/5 border-white/10"
        />

        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}>
          <SelectTrigger className="bg-white/5 border-white/10">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
            <SelectItem value="warned">Warned</SelectItem>
          </SelectContent>
        </Select>

        <Select value={activityFilter} onValueChange={(value) => {
          setActivityFilter(value);
          setPage(1);
        }}>
          <SelectTrigger className="bg-white/5 border-white/10">
            <SelectValue placeholder="Filter by Activity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activity</SelectItem>
            <SelectItem value="HIGH">High Activity</SelectItem>
            <SelectItem value="MEDIUM">Medium Activity</SelectItem>
            <SelectItem value="LOW">Low Activity</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={clearFilters} variant="outline">
          Clear Filters
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between">
          <p className="text-white">{selectedUsers.length} users selected</p>
          <div className="flex gap-2">
            <Button onClick={handleBulkWarn} variant="outline" size="sm" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Warn Selected
            </Button>
            <Button onClick={handleBulkBan} variant="destructive" size="sm" className="gap-2">
              <Ban className="h-4 w-4" />
              Ban Selected
            </Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/10 border-b border-white/10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={selectAllUsers}
                  className="rounded border-white/20"
                />
              </TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Games</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan="8" className="text-center py-8 text-muted-foreground">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan="8" className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id || user.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id || user.id)}
                      onChange={() => toggleUserSelection(user._id || user.id)}
                      className="rounded border-white/20"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-white">{user.username || user.name}</TableCell>
                  <TableCell className="text-white/70">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                      {user.status || 'active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActivityColor(user.activity || 'MEDIUM')}>
                      {user.activity || 'MEDIUM'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/70">{user.gamesPlayed || 0}</TableCell>
                  <TableCell className="text-white/70">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleWarnUser(user._id || user.id, user.username || user.name)}
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleBanUser(user._id || user.id, user.username || user.name)}
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing page {page}
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            variant="outline"
          >
            Previous
          </Button>
          <Button
            onClick={() => setPage(prev => prev + 1)}
            disabled={users.length === 0}
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
