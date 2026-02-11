import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within WebSocketProvider');
    }
    return context;
};

export const WebSocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const { toast } = useToast();

    useEffect(() => {
        // Initialize socket connection
        const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10
        });

        // Connection events
        socketInstance.on('connect', () => {
            console.log('[WebSocket] ⚡ Connected:', socketInstance.id);
            setConnected(true);
            setReconnectAttempts(0);

            // Join admin room if user is admin
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.role === 'admin') {
                socketInstance.emit('admin:join', user.id || user._id);
                console.log('[WebSocket] 👑 Joined admin room');
            } else if (user.id || user._id) {
                socketInstance.emit('user:join', user.id || user._id);
                console.log('[WebSocket] 👤 Joined user room');
            }
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('[WebSocket] ❌ Disconnected:', reason);
            setConnected(false);

            if (reason === 'io server disconnect') {
                // Server disconnected, manual reconnection needed
                socketInstance.connect();
            }
        });

        socketInstance.on('connect_error', (error) => {
            console.error('[WebSocket] ⚠️ Connection error:', error);
            setReconnectAttempts(prev => prev + 1);

            if (reconnectAttempts >= 5) {
                toast({
                    title: 'Connection Issue',
                    description: 'Unable to establish real-time connection. Some features may be limited.',
                    variant: 'destructive'
                });
            }
        });

        socketInstance.on('reconnect', (attemptNumber) => {
            console.log(`[WebSocket] 🔄 Reconnected after ${attemptNumber} attempts`);
            toast({
                title: 'Reconnected',
                description: 'Real-time connection restored.',
                variant: 'default'
            });
        });

        setSocket(socketInstance);

        // Cleanup
        return () => {
            if (socketInstance) {
                socketInstance.disconnect();
            }
        };
    }, []);

    // Subscribe to event
    const subscribe = useCallback((event, callback) => {
        if (!socket) return () => { };

        socket.on(event, callback);

        // Return unsubscribe function
        return () => {
            socket.off(event, callback);
        };
    }, [socket]);

    // Emit event
    const emit = useCallback((event, data) => {
        if (!socket || !connected) {
            console.warn('[WebSocket] Cannot emit: Not connected');
            return false;
        }

        socket.emit(event, data);
        return true;
    }, [socket, connected]);

    // Join room
    const joinRoom = useCallback((room) => {
        return emit('join:room', room);
    }, [emit]);

    // Leave room
    const leaveRoom = useCallback((room) => {
        return emit('leave:room', room);
    }, [emit]);

    // Join game room
    const joinGame = useCallback((gameId) => {
        return emit('game:join', gameId);
    }, [emit]);

    // Leave game room
    const leaveGame = useCallback((gameId) => {
        return emit('game:leave', gameId);
    }, [emit]);

    const value = {
        socket,
        connected,
        reconnectAttempts,
        subscribe,
        emit,
        joinRoom,
        leaveRoom,
        joinGame,
        leaveGame
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

export default WebSocketContext;
