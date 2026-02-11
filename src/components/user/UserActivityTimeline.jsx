import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  Clock,
  Gamepad2,
  Ban,
  AlertTriangle,
  CheckCircle,
  LogIn,
  LogOut
} from 'lucide-react';

export function UserActivityTimeline({ user, onClose }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserActivities();
  }, [user]);

  const fetchUserActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${user.playerId}/activity`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error("Failed to fetch user activities");

      const data = await response.json();
      setActivities(data.activities);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      LOGIN: <LogIn className="w-4 h-4 text-green-500" />,
      LOGOUT: <LogOut className="w-4 h-4 text-gray-500" />,
      GAME_START: <Gamepad2 className="w-4 h-4 text-blue-500" />,
      GAME_END: <CheckCircle className="w-4 h-4 text-green-500" />,
      BAN: <Ban className="w-4 h-4 text-red-500" />,
      WARN: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
      UNBAN: <CheckCircle className="w-4 h-4 text-green-500" />
    };
    return icons[type] || <Clock className="w-4 h-4 text-gray-500" />;
  };

  const getActivityColor = (type) => {
    const colors = {
      LOGIN: 'bg-green-500/10 text-green-700',
      LOGOUT: 'bg-gray-500/10 text-gray-700',
      GAME_START: 'bg-blue-500/10 text-blue-700',
      GAME_END: 'bg-green-500/10 text-green-700',
      BAN: 'bg-red-500/10 text-red-700',
      WARN: 'bg-yellow-500/10 text-yellow-700',
      UNBAN: 'bg-green-500/10 text-green-700'
    };
    return colors[type] || 'bg-gray-500/10 text-gray-700';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Activity Timeline</h2>
              <p className="text-gray-400">{user.username} - {user.email}</p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          <ScrollArea className="h-[60vh]">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading activities...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No activity found for this user</p>
                </div>
              ) : (
                activities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getActivityColor(activity.type)}>
                          {activity.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-white text-sm">{activity.description}</p>
                      {activity.details && (
                        <p className="text-gray-400 text-xs mt-1">{activity.details}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
