import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";

export function NotificationComposer({ onClose = () => {}, onSend = async () => {} }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("INFO");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title || !message) return;
    setSending(true);
    try {
      await onSend(title, message, priority);
      setTitle("");
      setMessage("");
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Compose Notification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
        <div className="flex items-center gap-2">
          <Select onValueChange={(val) => setPriority(val)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CRITICAL">CRITICAL</SelectItem>
              <SelectItem value="WARNING">WARNING</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1 text-sm text-muted-foreground">Priority determines delivery channel and urgency.</div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={sending}>Close</Button>
        <Button onClick={handleSend} disabled={sending || !title || !message}>{sending ? 'Sending...' : 'Send'}</Button>
      </CardFooter>
    </Card>
  );
}

export default NotificationComposer;
