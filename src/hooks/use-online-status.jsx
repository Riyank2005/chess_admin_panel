import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

export function useOnlineStatus() {
  const { connected } = useWebSocket() || {};
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Prefer WebSocket connection state when available
    if (typeof connected !== 'undefined') {
      setIsOnline(() => (navigator.onLine && connected));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connected]);

  return isOnline;
}

export default useOnlineStatus;
