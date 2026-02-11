import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Games from "./pages/Games";
import Tournaments from "./pages/Tournaments";
import Engine from "./pages/Engine";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// New admin panel pages
import UserManagement from "./pages/UserManagement";
import GameModeration from "./pages/GameModeration";
import Notifications from "./pages/Notifications";
import ApiKeys from "./pages/ApiKeys";
import ScheduledTasks from "./pages/ScheduledTasks";

// Authentication and global providers
import { AuthProvider, ProtectedRoute } from "@/context/AuthContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

import TermsOfService from "./pages/legal/TermsOfService";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import { ThemeProvider } from "next-themes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <WebSocketProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/legal/terms" element={<TermsOfService />} />
                  <Route path="/legal/privacy" element={<PrivacyPolicy />} />

                  {/* Protected Admin Routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="users" element={<Users />} />
                    <Route path="games" element={<Games />} />
                    <Route path="tournaments" element={<Tournaments />} />
                    <Route path="engine" element={<Engine />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<Settings />} />

                    {/* New Admin Panel Routes */}
                    <Route path="admin/user-management" element={<UserManagement />} />
                    <Route path="admin/game-moderation" element={<GameModeration />} />
                    <Route path="admin/notifications" element={<Notifications />} />
                    <Route path="admin/api-keys" element={<ApiKeys />} />
                    <Route path="admin/scheduled-tasks" element={<ScheduledTasks />} />

                    <Route path="*" element={<NotFound />} />
                  </Route>

                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
              <Toaster />
              <Sonner />
            </WebSocketProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

// export default App;

// 1. 🔒 Security & Production Readiness ⚠️ CRITICAL
// Issues:

// .env.local
//  and backend 
// .env
//  files might contain sensitive credentials
// No mentions of rate limiting, CORS security, or input sanitization
// OTP system needs security hardening
// What I'd Request:

// ✅ Add rate limiting to prevent brute force attacks
// ✅ Implement proper CORS configuration for production
// ✅ Add input validation and sanitization middleware
// ✅ Use environment-specific configs (dev, staging, prod)
// ✅ Add security headers (helmet.js)
// ✅ Implement proper session management with expiry
// 2. 📱 Mobile Responsiveness
// Issue: Admin dashboards with complex tables and maps often break on mobile

// What I'd Request:

// ✅ Test all pages on mobile devices (320px to 768px width)
// ✅ Add hamburger menu for sidebar navigation on mobile
// ✅ Make data tables scrollable/reorganize for mobile
// ✅ Ensure the Global Threat Map is touch-friendly
// ✅ Test OTP input boxes on mobile keyboards
// 3. 🎨 UI/UX Enhancements
// Current State: You have the "Prism Arctic" theme with glassmorphic elements

// Additional Requests:

// A. Loading States
// ✅ Add skeleton loaders for all data-fetching components
// ✅ Show loading spinners during API calls
// ✅ Add "No data" empty states with helpful CTAs
// B. Error Handling
// ✅ Better error messages (user-friendly, not technical)
// ✅ Retry mechanisms for failed API calls
// ✅ Offline mode detection with helpful messages
// C. Accessibility
// ✅ Add ARIA labels for screen readers
// ✅ Ensure keyboard navigation works throughout
// ✅ Add focus indicators for all interactive elements
// ✅ Check color contrast ratios (WCAG AA compliance)
// 4. 📊 Dashboard Improvements
// What I'd Want to See:

// Real-Time Updates
// javascript
// // Add WebSocket connections for:
// ✅ Live game moves updating in real-time
// ✅ User status changes (online/offline)
// ✅ Live threat alerts pulsing on the map
// ✅ Real-time notification counter
// Data Visualization
// ✅ Add charts showing trends over time (users, games, threats)
// ✅ Heatmap of peak activity hours
// ✅ Conversion funnel (signups → active players)
// ✅ Performance metrics (avg response time, server load)
// 5. 🎮 Game Management Features
// Enhanced Controls:

// ✅ Game replay viewer with move-by-move analysis
// ✅ Spectator mode for live games
// ✅ Automated cheat detection indicators
// ✅ Bulk actions (ban multiple users, terminate multiple games)
// ✅ Export game data as PGN files
// 6. 👥 User Management Enhancements
// What's Missing:

// ✅ Advanced search/filters (by registration date, activity, country)
// ✅ Bulk user import/export (CSV)
// ✅ User activity timeline/audit trail
// ✅ Communication tools (email templates for bans, warnings)
// ✅ User segmentation (VIP players, frequent players, inactive)
// 7. 📈 Analytics & Reporting
// I'd Want:

// ✅ Downloadable reports (PDF, Excel)
// ✅ Scheduled reports (email daily/weekly summaries)
// ✅ Custom date range selectors
// ✅ Comparison views (this week vs last week)
// ✅ Retention cohort analysis
// 8. 🔔 Notification System
// Enhancements:

// ✅ Push notifications for critical events
// ✅ Notification preferences (email, SMS, in-app)
// ✅ Priority levels (critical, warning, info)
// ✅ Mark as read/unread functionality
// ✅ Notification history with search
// 9. ⚙️ Settings & Configuration
// Additional Settings:

// ✅ Two-factor authentication for admin accounts
// ✅ Activity log for all admin actions (audit trail)
// ✅ Backup/restore functionality
// ✅ API key management with permissions
// ✅ Webhook configurations for integrations
// 10. 🚀 Performance Optimization
// Critical for Scalability:

// ✅ Implement pagination for all large data sets
// ✅ Add database indexing for frequent queries
// ✅ Use lazy loading for images and components
// ✅ Add caching (Redis) for frequently accessed data
// ✅ Optimize bundle size (code splitting)
// ✅ Add CDN for static assets
// 11. 📝 Documentation
// What's Needed:

// ✅ API documentation (Swagger/OpenAPI)
// ✅ User manual for admin features
// ✅ Deployment guide
// ✅ Troubleshooting guide
// ✅ Changelog for tracking updates
// 12. 🧪 Testing & Quality Assurance
// Requirements:

// ✅ Unit tests for critical backend functions
// ✅ Integration tests for API endpoints
// ✅ E2E tests for user flows (login, ban user, etc.)
// ✅ Load testing for handling concurrent users
// ✅ Security penetration testing
// 13. 🎯 Specific to Your Chess Platform
// Chess-Specific Features:

// ✅ ELO rating system integration
// ✅ Tournament bracket visualization
// ✅ Opening repertoire statistics
// ✅ Cheating detection algorithms (move analysis)
// ✅ Time control presets
// ✅ Game variant support (blitz, rapid, classical)
// 🎨 Visual/Branding Improvements
// While your "Prism Arctic" theme looks good, I'd suggest:

// Custom Logo & Favicon - More polished branding
// Onboarding Tour - Guided tour for new admins
// Dark/Light Mode Toggle - More prominent placement
// Customizable Dashboard - Drag-and-drop widgets
// Command Palette - Quick actions with Cmd/Ctrl + K
