import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  HardDrive,
  Users,
  Gamepad2,
  Settings as SettingsIcon,
  FileText
} from "lucide-react";
import { toast } from "sonner";

export function BackupRestore({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState([]);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [backupOptions, setBackupOptions] = useState({
    users: true,
    games: true,
    settings: true,
    notifications: true,
    auditLogs: false
  });

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/backup/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups);
      }
    } catch (error) {
      console.error('Failed to fetch backups:', error);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    setBackupProgress(0);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ options: backupOptions })
      });

      if (!response.ok) throw new Error('Failed to create backup');

      // Simulate progress
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      const data = await response.json();
      toast.success('Backup created successfully');
      fetchBackups();
      setBackupProgress(0);
    } catch (error) {
      console.error('Failed to create backup:', error);
      toast.error('Failed to create backup');
      setBackupProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async () => {
    if (!selectedBackup) {
      toast.error('Please select a backup to restore');
      return;
    }

    setLoading(true);
    setRestoreProgress(0);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ backupId: selectedBackup._id })
      });

      if (!response.ok) throw new Error('Failed to restore backup');

      // Simulate progress
      const progressInterval = setInterval(() => {
        setRestoreProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 5;
        });
      }, 1000);

      const data = await response.json();
      toast.success('Backup restored successfully');
      setRestoreProgress(0);
      onClose();
    } catch (error) {
      console.error('Failed to restore backup:', error);
      toast.error('Failed to restore backup');
      setRestoreProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = async (backup) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/backup/download/${backup._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to download backup');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${backup.createdAt.split('T')[0]}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully');
    } catch (error) {
      console.error('Failed to download backup:', error);
      toast.error('Failed to download backup');
    }
  };

  const deleteBackup = async (backupId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/backup/${backupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete backup');

      toast.success('Backup deleted successfully');
      fetchBackups();
    } catch (error) {
      console.error('Failed to delete backup:', error);
      toast.error('Failed to delete backup');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup & Restore
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="h-5 w-5" />
                Create Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create a backup of your system data. Select which data to include in the backup.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="users"
                      checked={backupOptions.users}
                      onCheckedChange={(checked) => setBackupOptions(prev => ({ ...prev, users: checked }))}
                    />
                    <label htmlFor="users" className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      User Data
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="games"
                      checked={backupOptions.games}
                      onCheckedChange={(checked) => setBackupOptions(prev => ({ ...prev, games: checked }))}
                    />
                    <label htmlFor="games" className="text-sm flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4" />
                      Game Data
                    </label>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="settings"
                      checked={backupOptions.settings}
                      onCheckedChange={(checked) => setBackupOptions(prev => ({ ...prev, settings: checked }))}
                    />
                    <label htmlFor="settings" className="text-sm flex items-center gap-2">
                      <SettingsIcon className="h-4 w-4" />
                      System Settings
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auditLogs"
                      checked={backupOptions.auditLogs}
                      onCheckedChange={(checked) => setBackupOptions(prev => ({ ...prev, auditLogs: checked }))}
                    />
                    <label htmlFor="auditLogs" className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Audit Logs
                    </label>
                  </div>
                </div>
              </div>

              {backupProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Creating backup...</span>
                    <span>{backupProgress}%</span>
                  </div>
                  <Progress value={backupProgress} />
                </div>
              )}

              <Button onClick={createBackup} disabled={loading || backupProgress > 0}>
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                Create Backup
              </Button>
            </CardContent>
          </Card>

          {/* Available Backups */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Available Backups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backups.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No backups available
                  </p>
                ) : (
                  backups.map((backup) => (
                    <div
                      key={backup._id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedBackup?._id === backup._id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedBackup(backup)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Database className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">
                              Backup {new Date(backup.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(backup.size)} • {backup.includes.join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(backup.createdAt).toLocaleTimeString()}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadBackup(backup);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Restore Backup */}
          {selectedBackup && (
            <Card className="border-orange-500/20 bg-orange-500/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                  Restore Backup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <p className="text-sm font-medium text-orange-800">
                    Selected: Backup from {new Date(selectedBackup.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    This will restore: {selectedBackup.includes.join(', ')}
                  </p>
                  <p className="text-xs text-orange-600 mt-2">
                    ⚠️ This action cannot be undone. Current data will be replaced.
                  </p>
                </div>

                {restoreProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Restoring backup...</span>
                      <span>{restoreProgress}%</span>
                    </div>
                    <Progress value={restoreProgress} />
                  </div>
                )}

                <Button
                  variant="destructive"
                  onClick={restoreBackup}
                  disabled={loading || restoreProgress > 0}
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Restore Backup
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
