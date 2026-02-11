/**
 * WebSocket Service
 * Handle real-time communication between server and clients
 */

class SocketService {
    /**
     * Emit event to specific user
     */
    static emitToUser(userId, event, data) {
        try {
            const socketId = global.activeUsers.get(userId);
            if (socketId && global.io) {
                global.io.to(socketId).emit(event, data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[SocketService] Error emitting to user:', error);
            return false;
        }
    }

    /**
     * Emit event to all admins
     */
    static emitToAdmins(event, data) {
        try {
            if (global.io) {
                global.io.to('admins').emit(event, data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[SocketService] Error emitting to admins:', error);
            return false;
        }
    }

    /**
     * Emit event to specific game room
     */
    static emitToGame(gameId, event, data) {
        try {
            if (global.io) {
                global.io.to(`game:${gameId}`).emit(event, data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[SocketService] Error emitting to game:', error);
            return false;
        }
    }

    /**
     * Broadcast to all connected clients
     */
    static broadcast(event, data) {
        try {
            if (global.io) {
                global.io.emit(event, data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[SocketService] Error broadcasting:', error);
            return false;
        }
    }

    /**
     * Broadcast admin notification
     */
    static broadcastAdminNotification(notification) {
        return this.emitToAdmins('notification:new', notification);
    }

    /**
     * Broadcast system alert
     */
    static broadcastSystemAlert(alert) {
        return this.broadcast('system:alert', alert);
    }

    /**
     * Notify about user status change
     */
    static notifyUserStatusChange(userId, status, reason) {
        const data = { userId, status, reason, timestamp: new Date() };

        // Notify the user
        this.emitToUser(userId, 'user:status_changed', data);

        // Notify admins
        this.emitToAdmins('user:status_changed', data);

        return data;
    }

    /**
     * Notify about new game move
     */
    static notifyGameMove(gameId, move, gameState) {
        return this.emitToGame(gameId, 'game:move', { move, gameState, timestamp: new Date() });
    }

    /**
     * Notify about game end
     */
    static notifyGameEnd(gameId, result, reason) {
        const data = { gameId, result, reason, timestamp: new Date() };
        this.emitToGame(gameId, 'game:ended', data);
        this.emitToAdmins('game:ended', data);
        return data;
    }

    /**
     * Send threat alert to admins (for banned users, suspicious activity, etc.)
     */
    static sendThreatAlert(threat) {
        return this.emitToAdmins('threat:detected', {
            ...threat,
            timestamp: new Date(),
            priority: threat.priority || 'medium'
        });
    }

    /**
     * Update live statistics
     */
    static updateLiveStats(stats) {
        return this.emitToAdmins('stats:update', {
            ...stats,
            timestamp: new Date()
        });
    }

    /**
     * Get active users count
     */
    static getActiveUsersCount() {
        return global.activeUsers ? global.activeUsers.size : 0;
    }

    /**
     * Get active admins count
     */
    static getActiveAdminsCount() {
        return global.activeAdmins ? global.activeAdmins.size : 0;
    }

    /**
     * Check if user is online
     */
    static isUserOnline(userId) {
        return global.activeUsers ? global.activeUsers.has(userId) : false;
    }

    /**
     * Get all active user IDs
     */
    static getActiveUserIds() {
        return global.activeUsers ? Array.from(global.activeUsers.keys()) : [];
    }
}

export default SocketService;
