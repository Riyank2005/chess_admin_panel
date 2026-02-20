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
import { AuthProvider, ProtectedRoute, useAuth } from "@/context/AuthContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

import TermsOfService from "./pages/legal/TermsOfService";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import { ThemeProvider } from "next-themes";

// Player pages
import { PlayerLayout } from "@/components/layout/PlayerLayout";
import PlayerDashboard from "./pages/PlayerDashboard";
import PlayerGameCenter from "./pages/PlayerGameCenter";
import PlayerTournaments from "./pages/PlayerTournaments";
import PlayerAnalytics from "./pages/PlayerAnalytics";
import PlayerProfile from "./pages/PlayerProfile";
import PlayerSocial from "./pages/PlayerSocial";
import PlayerSettings from "./pages/PlayerSettings";
import PlayerGameAnalysis from "./pages/PlayerGameAnalysis";
import PlayerFairPlay from "./pages/PlayerFairPlay";
import QuickPlay from "./pages/QuickPlay";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// ... imports kept ...

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
                  <Route path="/quickplay" element={<QuickPlay />} />
                  <Route path="/legal/terms" element={<TermsOfService />} />
                  <Route path="/legal/privacy" element={<PrivacyPolicy />} />

                  {/* Protected Admin Routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
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
                  </Route>

                  {/* Protected Player Routes */}
                  <Route
                    path="/player"
                    element={
                      <ProtectedRoute allowedRoles={['player']}>
                        <PlayerLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<PlayerDashboard />} />
                    <Route path="games" element={<PlayerGameCenter />} />
                    <Route path="tournaments" element={<PlayerTournaments />} />
                    <Route path="analytics" element={<PlayerAnalytics />} />
                    <Route path="profile" element={<PlayerProfile />} />
                    <Route path="social" element={<PlayerSocial />} />
                    <Route path="settings" element={<PlayerSettings />} />
                    <Route path="analysis" element={<PlayerGameAnalysis />} />
                    <Route path="fair-play" element={<PlayerFairPlay />} />
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
