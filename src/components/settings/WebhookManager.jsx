import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Webhook,
  Plus,
  Trash2,
  TestTube,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Send,
  Activity,
  Clock,
  Zap
} from "lucide-react";
import { toast } from "sonner";

export function WebhookManager({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [webhooks, setWebhooks] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    events: [],
    headers: "",
    secret: "",
    active: true
  });
  const [testResults, setTestResults] = useState({});

  const availableEvents = [
    { id: 'user.registered', label: 'User Registered', category: 'Users' },
    { id: 'user.banned', label: 'User Banned', category: 'Users' },
    { id: 'game.started', label: 'Game Started', category: 'Games' },
    { id: 'game.completed', label: 'Game Completed', category: 'Games' },
    { id: 'game.cheat_detected', label: 'Cheat Detected', category: 'Games' },
    { id: 'notification.sent', label: 'Notification Sent', category: 'Notifications' },
    { id: 'system.backup_completed', label: 'Backup Completed', category: 'System' },
    { id: 'system.error', label: 'System Error', category: 'System' }
  ];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/webhooks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks);
      }
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    }
  };

  const createWebhook = async () => {
    if (!newWebhook.name.trim() || !newWebhook.url.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newWebhook.events.length === 0) {
      toast.error('Please select at least one event');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newWebhook)
      });

      if (!response.ok) throw new Error('Failed to create webhook');

      toast.success('Webhook created successfully');
      setNewWebhook({
        name: "",
        url: "",
        events: [],
        headers: "",
        secret: "",
        active: true
      });
      setShowCreateDialog(false);
      fetchWebhooks();
    } catch (error) {
      console.error('Failed to create webhook:', error);
      toast.error('Failed to create webhook');
    } finally {
      setLoading(false);
    }
  };

  const deleteWebhook = async (webhookId) => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete webhook');

      toast.success('Webhook deleted successfully');
      fetchWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      toast.error('Failed to delete webhook');
    }
  };

  const toggleWebhook = async (webhookId, active) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active })
      });

      if (!response.ok) throw new Error('Failed to update webhook');

      toast.success(`Webhook ${active ? 'enabled' : 'disabled'} successfully`);
      fetchWebhooks();
    } catch (error) {
      console.error('Failed to update webhook:', error);
      toast.error('Failed to update webhook');
    }
  };

  const testWebhook = async (webhook) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/webhooks/${webhook._id}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      setTestResults(prev => ({
        ...prev,
        [webhook._id]: {
          success: response.ok,
          status: response.status,
          response: result,
          timestamp: new Date()
        }
      }));

      if (response.ok) {
        toast.success('Webhook test successful');
      } else {
        toast.error('Webhook test failed');
      }
    } catch (error) {
      console.error('Failed to test webhook:', error);
      setTestResults(prev => ({
        ...prev,
        [webhook._id]: {
          success: false,
          error: error.message,
          timestamp: new Date()
        }
      }));
      toast.error('Webhook test failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEventToggle = (eventId) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(id => id !== eventId)
        : [...prev.events, eventId]
    }));
  };

  const getEventCategory = (eventId) => {
    const event = availableEvents.find(e => e.id === eventId);
    return event?.category || 'Unknown';
  };

  const groupEventsByCategory = () => {
    return availableEvents.reduce((acc, event) => {
      if (!acc[event.category]) {
        acc[event.category] = [];
      }
      acc[event.category].push(event);
      return acc;
    }, {});
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                Configure webhooks to receive real-time notifications about system events.
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Webhook
            </Button>
          </div>

          {/* Webhooks List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webhooks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No webhooks configured yet
                  </p>
                ) : (
                  webhooks.map((webhook) => (
                    <div key={webhook._id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <Webhook className={`h-5 w-5 ${webhook.active ? 'text-green-500' : 'text-gray-400'}`} />
                            <div>
                              <p className="font-medium">{webhook.name}</p>
                              <p className="text-sm text-muted-foreground">{webhook.url}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {webhook.events.map((eventId) => (
                              <Badge key={eventId} variant="outline" className="text-xs">
                                {availableEvents.find(e => e.id === eventId)?.label || eventId}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Created: {new Date(webhook.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="h-4 w-4" />
                              Last triggered: {webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleDateString() : 'Never'}
                            </span>
                            <Badge variant={webhook.active ? 'default' : 'secondary'}>
                              {webhook.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          {testResults[webhook._id] && (
                            <div className={`p-3 rounded-lg text-sm ${
                              testResults[webhook._id].success
                                ? 'bg-green-500/10 border border-green-500/20'
                                : 'bg-red-500/10 border border-red-500/20'
                            }`}>
                              <p className={`font-medium ${testResults[webhook._id].success ? 'text-green-600' : 'text-red-600'}`}>
                                Test Result: {testResults[webhook._id].success ? 'Success' : 'Failed'}
                              </p>
                              <p className="text-xs mt-1">
                                Status: {testResults[webhook._id].status || 'Error'} •
                                {new Date(testResults[webhook._id].timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testWebhook(webhook)}
                            disabled={loading}
                          >
                            <TestTube className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleWebhook(webhook._id, !webhook.active)}
                          >
                            {webhook.active ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteWebhook(webhook._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Create Webhook Dialog */}
          {showCreateDialog && (
            <Dialog open={true} onOpenChange={setShowCreateDialog}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create New Webhook
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Webhook Name</Label>
                      <Input
                        value={newWebhook.name}
                        onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Discord Notifications"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <Input
                        value={newWebhook.url}
                        onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://your-app.com/webhook"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Events to Listen For</Label>
                    <div className="space-y-4">
                      {Object.entries(groupEventsByCategory()).map(([category, events]) => (
                        <div key={category} className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                            {category}
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {events.map((event) => (
                              <div key={event.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={event.id}
                                  checked={newWebhook.events.includes(event.id)}
                                  onCheckedChange={() => handleEventToggle(event.id)}
                                />
                                <label htmlFor={event.id} className="text-sm">
                                  {event.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Secret Key (Optional)</Label>
                      <Input
                        value={newWebhook.secret}
                        onChange={(e) => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))}
                        placeholder="For webhook signature verification"
                        type="password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Custom Headers (JSON)</Label>
                      <Textarea
                        value={newWebhook.headers}
                        onChange={(e) => setNewWebhook(prev => ({ ...prev, headers: e.target.value }))}
                        placeholder='{"Authorization": "Bearer token"}'
                        className="h-20"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="active"
                      checked={newWebhook.active}
                      onCheckedChange={(checked) => setNewWebhook(prev => ({ ...prev, active: checked }))}
                    />
                    <label htmlFor="active" className="text-sm">Enable webhook immediately</label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button onClick={createWebhook} disabled={loading}>
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Create Webhook
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
