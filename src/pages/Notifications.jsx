import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NotificationComposer } from "@/components/notifications/NotificationComposer";
import { NotificationHistory } from "@/components/notifications/NotificationHistory";
import {
  Bell,
  Trash2,
  CheckCircle,
  Loader2,
  Settings,
  Send,
  Search,
  Filter,
  AlertTriangle,
  Info,
  Zap,
  Mail,
  MessageSquare,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/skeleton";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showComposer, setShowComposer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: true,
    sms: false,
    push: true,
    critical: true,
    warning: true,
    info: false
  });

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page);

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error("Failed to fetch notifications");
      
      const data = await response.json();
      setNotifications(data.notifications);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId })
      });

      if (!response.ok) throw new Error("Failed to mark as read");
      fetchNotifications();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete");
      toast.success("Notification deleted");
      fetchNotifications();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      ALERT: "bg-red-500/10 text-red-700",
      INFO: "bg-blue-500/10 text-blue-700",
      WARNING: "bg-yellow-500/10 text-yellow-700",
      ERROR: "bg-red-500/10 text-red-700",
      SUCCESS: "bg-green-500/10 text-green-700"
    };
    return colors[type] || "";
  };

  // Bulk Actions
  const handleBulkMarkAsRead = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      const response = await fetch("/api/notifications/bulk-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: selectedNotifications })
      });

      if (!response.ok) throw new Error("Failed to mark notifications as read");
      toast.success(`Marked ${selectedNotifications.length} notifications as read`);
      setSelectedNotifications([]);
      fetchNotifications();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      const response = await fetch("/api/notifications/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: selectedNotifications })
      });

      if (!response.ok) throw new Error("Failed to delete notifications");
      toast.success(`Deleted ${selectedNotifications.length} notifications`);
      setSelectedNotifications([]);
      fetchNotifications();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Notification Preferences
  const updateNotificationPreferences = async (preferences) => {
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) throw new Error("Failed to update preferences");
      setNotificationPreferences(preferences);
      toast.success("Notification preferences updated");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Selection Management
  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const selectAllNotifications = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(notif => notif._id));
    }
  };

  // Push Notification Simulation
  const sendPushNotification = async (title, message, priority = 'info') => {
    try {
      const response = await fetch("/api/notifications/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, priority })
      });

      if (!response.ok) throw new Error("Failed to send push notification");
      toast.success("Push notification sent");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-2">Manage your admin alerts</p>
        </div>
        <Button onClick={fetchNotifications} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                  onCheckedChange={selectAllNotifications}
                />
              </TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan="8" className="text-center py-8">
                  <TableSkeleton rows={3} columns={8} />
                </TableCell>
              </TableRow>
            ) : notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan="8" className="text-center py-8">
                  No notifications
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((notif) => (
                <TableRow key={notif._id} className={notif.read ? "opacity-60" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedNotifications.includes(notif._id)}
                      onCheckedChange={() => toggleNotificationSelection(notif._id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      notif.priority === 'CRITICAL' ? 'destructive' :
                      notif.priority === 'WARNING' ? 'secondary' :
                      'outline'
                    }>
                      {notif.priority === 'CRITICAL' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {notif.priority === 'WARNING' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {notif.priority === 'INFO' && <Info className="w-3 h-3 mr-1" />}
                      {notif.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(notif.type)}>
                      {notif.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{notif.title}</TableCell>
                  <TableCell className="max-w-md truncate">{notif.message}</TableCell>
                  <TableCell>{new Date(notif.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {notif.read ? (
                      <span className="text-sm text-muted-foreground">Read</span>
                    ) : (
                      <span className="text-sm text-blue-600 font-semibold">New</span>
                    )}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    {!notif.read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRead(notif._id)}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(notif._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
        <div className="flex gap-2">
          <Button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <Button
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.pages || loading}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Modals */}
      {showComposer && (
        <NotificationComposer
          onClose={() => setShowComposer(false)}
          onSend={sendPushNotification}
        />
      )}

      {showHistory && (
        <NotificationHistory
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
