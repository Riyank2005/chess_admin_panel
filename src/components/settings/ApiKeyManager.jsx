import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function ApiKeyManager({ onClose }) {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchKeys = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/api-keys', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch API keys');
        const data = await res.json();
        if (mounted) setKeys(data.keys || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load API keys');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchKeys();
    return () => { mounted = false; };
  }, []);

  const createKey = async () => {
    if (!newName.trim()) return toast.error('Enter a name for the key');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (!res.ok) throw new Error('Failed to create API key');
      const data = await res.json();
      toast.success('API key created');
      setKeys(prev => [data.key, ...prev]);
      setNewName("");
    } catch (err) {
      console.error(err);
      toast.error('Failed to create API key');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>API Keys</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Key name" />
                <Button onClick={createKey}>Create</Button>
              </div>

              <div className="mt-4">
                {loading ? (
                  <p>Loading...</p>
                ) : keys.length === 0 ? (
                  <p>No API keys</p>
                ) : (
                  <ul className="space-y-2">
                    {keys.map(k => (
                      <li key={k._id} className="font-mono text-sm">
                        {k.name} - {k.key?.slice(0,8)}...
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
