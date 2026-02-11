import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export function NotificationHistory({ onClose = () => {} }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/notifications?limit=20');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!mounted) return;
        setHistory(data.notifications || []);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <CardTitle>Notification History</CardTitle>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <div className="text-sm text-muted-foreground">Loading...</div> : (
          <div className="space-y-2 max-h-80 overflow-auto">
            {history.length === 0 ? <div className="text-sm text-muted-foreground">No history</div> : (
              history.map(h => (
                <div key={h._id} className="p-3 border rounded bg-[#0b0b0b]">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm">{h.title}</div>
                      <div className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{h.type}</div>
                  </div>
                  <div className="mt-2 text-sm text-white/60">{h.message}</div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NotificationHistory;
