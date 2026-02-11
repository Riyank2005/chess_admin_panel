import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Play, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ScheduledTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    taskType: "CLEANUP",
    schedule: "0 0 * * *" // Daily at midnight
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error("Failed to create task");
      toast.success("Task created");
      setFormData({ name: "", description: "", taskType: "CLEANUP", schedule: "0 0 * * *" });
      setShowCreate(false);
      fetchTasks();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleExecute = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/execute`, {
        method: "POST"
      });

      if (!response.ok) throw new Error("Failed to execute task");
      toast.success("Task started");
      fetchTasks();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-gray-500/10 text-gray-700",
      RUNNING: "bg-blue-500/10 text-blue-700",
      COMPLETED: "bg-green-500/10 text-green-700",
      FAILED: "bg-red-500/10 text-red-700"
    };
    return colors[status] || "";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Scheduled Tasks</h1>
          <p className="text-muted-foreground mt-2">Manage automated system tasks</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Task Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Daily Cleanup"
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task description"
                />
              </div>
              <div>
                <Label>Task Type</Label>
                <Select value={formData.taskType} onValueChange={(value) => setFormData({ ...formData, taskType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLEANUP">Cleanup</SelectItem>
                    <SelectItem value="RESET">Reset</SelectItem>
                    <SelectItem value="BACKUP">Backup</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="REPORT">Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Schedule (Cron)</Label>
                <Input
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  placeholder="0 0 * * *"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create</Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Run</TableHead>
              <TableHead>Next Run</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan="7" className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan="7" className="text-center py-8">
                  No scheduled tasks
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task._id}>
                  <TableCell className="font-medium">{task.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{task.taskType}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{task.schedule}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.lastRun ? new Date(task.lastRun).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    {task.nextRun ? new Date(task.nextRun).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    {task.enabled && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExecute(task._id)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
