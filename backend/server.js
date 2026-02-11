import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import userRoutes from './routes/userRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import userManagementRoutes from './routes/userManagementRoutes.js';
import gameModRoutes from './routes/gameModRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import apiKeyRoutes from './routes/apiKeyRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import admin2faRoutes from './routes/admin2faRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';
import { loginAdmin } from './controllers/adminAuthController.js';
import {
    apiLimiter,
    authLimiter,
    otpLimiter,
    passwordResetLimiter,
    helmetConfig,
    sanitizeInput,
    xssProtection,
    corsOptions,
    hppProtection
} from './middleware/security.js';
import config from './config/config.js';
import path from 'path';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);

// Socket.IO setup for real-time features
const io = new Server(httpServer, {
    cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST'],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

// Store active WebSocket connections
global.io = io;
global.activeUsers = new Map();
global.activeAdmins = new Set();

io.on('connection', (socket) => {
    console.log(`[SOCKET] ⚡ New connection: ${socket.id}`);

    socket.on('admin:join', (adminId) => {
        global.activeUsers.set(adminId, socket.id);
        global.activeAdmins.add(socket.id);
        socket.join('admins');
        console.log(`[SOCKET] 👑 Admin ${adminId} joined`);

        // Notify other admins
        socket.to('admins').emit('admin:online', { adminId, socketId: socket.id });
    });

    socket.on('user:join', (userId) => {
        global.activeUsers.set(userId, socket.id);
        socket.join(`user:${userId}`);
        console.log(`[SOCKET] 👤 User ${userId} joined`);

        // Notify admins
        io.to('admins').emit('user:online', { userId, socketId: socket.id });
    });

    socket.on('game:join', (gameId) => {
        socket.join(`game:${gameId}`);
        console.log(`[SOCKET] 🎮 Joined game room: ${gameId}`);
    });

    socket.on('game:leave', (gameId) => {
        socket.leave(`game:${gameId}`);
        console.log(`[SOCKET] 🎮 Left game room: ${gameId}`);
    });

    socket.on('disconnect', () => {
        // Remove from active users
        for (const [userId, socketId] of global.activeUsers.entries()) {
            if (socketId === socket.id) {
                global.activeUsers.delete(userId);
                global.activeAdmins.delete(socket.id);
                console.log(`[SOCKET] ❌ User ${userId} disconnected`);

                // Notify admins
                io.to('admins').emit('user:offline', { userId });
                break;
            }
        }
    });

    socket.on('error', (error) => {
        console.error('[SOCKET] ⚠️ Error:', error);
    });
});

// Security Middleware - Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*", "ws://localhost:*"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - using imported corsOptions from security middleware
app.use(cors(corsOptions));

// Compression middleware - gzip/deflate
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6
}));

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security Middleware - Apply comprehensive security measures
app.use(sanitizeInput); // Input sanitization
app.use(xssProtection); // XSS protection
app.use(hppProtection); // HTTP Parameter Pollution protection

// Rate limiting - Apply to all routes
app.use('/api/', apiLimiter);

// Specific rate limiting for sensitive routes
app.use('/api/auth/admin/login', authLimiter);
app.use('/api/auth/verify-otp', otpLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);

// Request logging with performance tracking
app.use((req, res, next) => {
    const start = Date.now();
    const originalJson = res.json;

    res.json = function (data) {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
        console.log(`${logLevel} [${req.method}] ${req.url} - ${res.statusCode} - ${duration}ms`);
        return originalJson.call(this, data);
    };

    next();
});

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Health check endpoint
app.get('/api/ping', (req, res) => {
    res.json({
        status: 'ChessMaster Online',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        activeConnections: global.activeUsers.size,
        activeAdmins: global.activeAdmins.size
    });
});

// Serve minimal OpenAPI JSON for docs
app.get('/api/docs', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'backend', 'docs', 'swagger.json'));
});

// WebSocket status endpoint
app.get('/api/socket/status', (req, res) => {
    res.json({
        connected: io.engine.clientsCount,
        activeUsers: global.activeUsers.size,
        activeAdmins: global.activeAdmins.size
    });
});

// Routes
app.post('/api/auth/admin/login', loginAdmin);
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/users/management', userManagementRoutes);
app.use('/api/games/moderation', gameModRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/admin/2fa', admin2faRoutes);
app.use('/api/tournaments', tournamentRoutes);

// 404 Handler
app.use((req, res) => {
    console.warn(`[404] Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        error: 'Route not found',
        path: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[ERROR] 🔥', err);

    // Don't leak error details in production
    const isDev = process.env.NODE_ENV !== 'production';

    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(isDev && {
            stack: err.stack,
            details: err.details
        }),
        timestamp: new Date().toISOString()
    });
});

const PORT = config.port;

// Use httpServer instead of app.listen to support WebSocket
httpServer.listen(PORT, () => {
    console.log(`\n`);
    console.log(`╔════════════════════════════════════════════════════════╗`);
    console.log(`║                                                        ║`);
    console.log(`║        🎮 NEXUS PRO - MASTER CONTROL ONLINE 🎮        ║`);
    console.log(`║                                                        ║`);
    console.log(`╠════════════════════════════════════════════════════════╣`);
    console.log(`║  🚀 Server Status: ACTIVE                              ║`);
    console.log(`║  🌐 Port: ${PORT.toString().padEnd(47)}║`);
    console.log(`║  📡 API Endpoint: http://localhost:${PORT.toString().padEnd(19)}║`);
    console.log(`║  ⚡ WebSocket: ENABLED                                 ║`);
    console.log(`║  🔐 Security: HARDENED                                 ║`);
    console.log(`║  🔒 OTP System: ENABLED                                ║`);
    console.log(`║  📊 Database: MongoDB Connected                        ║`);
    console.log(`║  🗜️  Compression: ENABLED                               ║`);
    console.log(`╚════════════════════════════════════════════════════════╝`);
    console.log(`\n`);
    console.log(`✅ Ready to receive tactical commands...\n`);
});

// Handle port errors
httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n[ERROR] ❌ Port ${PORT} is already in use!`);
        console.error('Solution options:');
        console.error(`1. Kill existing process: netstat -ano | findstr :${PORT}`);
        console.error(`2. Use a different port: set PORT=5001 && npm run server`);
        console.error(`3. Wait 30 seconds and try again\n`);
        process.exit(1);
    } else if (err.code === 'EACCES') {
        console.error(`\n[ERROR] ❌ Permission denied on port ${PORT}`);
        console.error('Try using a port above 1024 or run with administrator privileges\n');
        process.exit(1);
    } else {
        console.error('[ERROR] ❌ Server error:', err);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n[SHUTDOWN] 🛑 SIGTERM received, shutting down gracefully...');
    httpServer.close(() => {
        console.log('[SHUTDOWN] ✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n[SHUTDOWN] 🛑 SIGINT received, shutting down gracefully...');
    httpServer.close(() => {
        console.log('[SHUTDOWN] ✅ Server closed');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('[FATAL] 💀 Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] 💀 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
