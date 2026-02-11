# Quick Reference Guide - Chess Master Control

## 🚀 Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start backend server
npm run server

# Start frontend (in separate terminal)
npm run dev
```

---

## 📁 Project Structure

```
├── backend/
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── security.js          # ✨ NEW: Rate limiting, sanitization
│   │   └── validators.js        # ✨ NEW: Input validation
│   ├── services/
│   │   └── socketService.js     # ✨ NEW: WebSocket helpers
│   ├── utils/
│   │   └── logger.js            # ✨ NEW: Winston logging
│   └── server.js                # ✨ UPDATED: WebSocket + security
│
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.jsx    # ✨ NEW: Error handling
│   │   └── ui/
│   │       ├── skeleton.jsx     # ✨ UPDATED: Loading states
│   │       └── empty-state.jsx  # ✨ NEW: Empty states
│   ├── context/
│   │   ├── AuthContext.jsx       # Existing auth
│   │   └── WebSocketContext.jsx  # ✨ NEW: Real-time connection
│   ├── index.css                 # ✨ UPDATED: Mobile + accessibility
│   └── App.jsx                   # ✨ UPDATED: Error boundary + WebSocket
```

---

## 🔌 WebSocket Usage

### Frontend - Subscribe to Events

```javascript
import { useWebSocket } from '@/context/WebSocketContext';

function MyComponent() {
  const { subscribe, connected } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('user:status_changed', (data) => {
      console.log('User status changed:', data);
      // Handle the event
    });

    return unsubscribe; // Cleanup
  }, [subscribe]);

  return <div>{connected ? '🟢 Online' : '🔴 Offline'}</div>;
}
```

### Backend - Emit Events

```javascript
import SocketService from './services/socketService.js';

// Notify specific user
SocketService.emitToUser(userId, 'notification:new', { message: 'Hello!' });

// Broadcast to all admins
SocketService.emitToAdmins('threat:alert', { type: 'ban', userId: '123' });

// Send to game room
SocketService.emitToGame(gameId, 'game:move', { move: 'e2e4' });

// Broadcast to everyone
SocketService.broadcast('system:maintenance', { inMinutes: 10 });
```

---

## 🎨 UI Components

### Loading States

```javascript
import { DashboardSkeleton, TableSkeleton } from '@/components/ui/skeleton';

{loading ? <DashboardSkeleton /> : <ActualContent />}
```

### Empty States

```javascript
import { NoUsers, DatabaseError } from '@/components/ui/empty-state';

{users.length === 0 && <NoUsers onCreate={handleCreate} />}
{error && <DatabaseError onRetry={refetch} />}
```

---

## 🛡️ Security

### Rate Limiting

Automatically applied to routes:
- Auth endpoints: 5 requests / 15 min
- OTP endpoints: 3 requests / 15 min
- General API: 100 requests / 15 min

To customize, edit: `backend/middleware/security.js`

### Input Validation

Use validators in routes:

```javascript
import { validateUserUpdate } from './middleware/validators.js';

router.put('/users/:id', validateUserUpdate, updateUser);
```

---

## 📱 Mobile Responsive Classes

```javascript
// Hide on mobile
<div className="mobile-hidden">Desktop only</div>

// Hide on desktop
<div className="desktop-hidden">Mobile only</div>

// Mobile full width
<div className="mobile-full-width">Stretches edge to edge</div>
```

---

## ♿ Accessibility

### Focus Rings

```javascript
<button className="focus-ring">Accessible Button</button>
```

### Connection Status

```javascript
<span className="connection-status online"></span> Online
<span className="connection-status offline"></span> Offline
<span className="connection-status connecting"></span> Connecting
```

---

## 🔧 Common Tasks

### Add a New Validated Route

1. Create validator in `backend/middleware/validators.js`:
```javascript
export const validateMyData = [
  body('field').notEmpty().withMessage('Required'),
  handleValidationErrors
];
```

2. Use in route:
```javascript
router.post('/my-route', validateMyData, myController);
```

### Add Real-Time Feature

1. Backend - emit event:
```javascript
SocketService.emitToAdmins('my:event', data);
```

2. Frontend - subscribe:
```javascript
const { subscribe } = useWebSocket();

useEffect(() => {
  return subscribe('my:event', handleMyEvent);
}, []);
```

### Add Loading State to Page

```javascript
import { DashboardSkeleton } from '@/components/ui/skeleton';

function MyPage() {
  const { data, isLoading } = useQuery(['myData'], fetchData);

  if (isLoading) return <DashboardSkeleton />;
  
  return <div>{/* actual content */}</div>;
}
```

---

## 🐛 Debugging

### Check WebSocket Connection

```javascript
// Browser console
window.io or global.io
```

### View Logs

Backend logs are in: `backend/logs/`
- `error.log` - errors only
- `combined.log` - all logs
- `exceptions.log` - uncaught exceptions

### Enable Debug Mode

```env
LOG_LEVEL=debug
NODE_ENV=development
```

---

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:5001/api/ping
```

Response:
```json
{
  "status": "Nexus Online",
  "timestamp": "2026-02-05T...",
  "uptime": 12345,
  "activeConnections": 5,
  "activeAdmins": 2
}
```

### WebSocket Status

```bash
curl http://localhost:5001/api/socket/status
```

---

## 🎯 Best Practices

### ✅ DO:
- Use skeleton components while loading
- Add empty states for no data scenarios
- Validate all user inputs
- Use WebSocket for real-time features
- Test on mobile devices
- Add ARIA labels to interactive elements
- Handle errors gracefully

### ❌ DON'T:
- Expose sensitive data in error messages (production)
- Skip input validation
- Ignore rate limiting warnings
- Forget to clean up WebSocket subscriptions
- Use fixed pixel values for responsive design
- Block the main thread with heavy operations

---

## 🔑 Environment Variables

### Required

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chess_db
JWT_SECRET=your_secure_random_string
```

### Optional

```env
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
LOG_LEVEL=info
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Login/logout works
- [ ] WebSocket connects automatically
- [ ] Real-time updates appear
- [ ] Mobile layout is usable
- [ ] Keyboard navigation works
- [ ] Loading states show correctly
- [ ] Empty states display properly
- [ ] Error messages are user-friendly
- [ ] Rate limiting kicks in
- [ ] Logs are being written

---

## 🆘 Troubleshooting

### WebSocket won't connect
- Check CORS settings in `server.js`
- Verify FRONTEND_URL environment variable
- Check browser console for errors

### Rate limiting too aggressive
- Adjust limits in `backend/middleware/security.js`
- Clear rate limit cache (restart server)

### Validation failing unexpectedly
- Check validator error messages
- Verify input format matches rules
- Review `backend/middleware/validators.js`

### Mobile layout broken
- Check media queries in `index.css`
- Verify Tailwind CSS processing
- Test in browser DevTools mobile mode

---

## 📚 Related Documentation

- [Full Upgrade Documentation](./UPGRADE_DOCUMENTATION.md)
- [API Documentation](./API_DOCS.md) _(to be created)_
- [Deployment Guide](./DEPLOYMENT.md) _(to be created)_

---

**Need help?** Check the main documentation or create an issue!
