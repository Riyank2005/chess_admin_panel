# Master Control Admin Panel Overview

## 1. System Architecture
The application is a full-stack MERN (MongoDB, Express, React, Node.js) web application designed as a "Master Control" dashboard for a chess platform. It features a high-tech "Prism Arctic" aesthetic and tactical user flows.

### Tech Stack
-   **Frontend**: React 19, Vite, Tailwind CSS, Shadcn UI, Framer Motion, TanStack Query.
-   **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io.
-   **Authentication**: Custom JWT-based auth with Tactical OTP (One-Time Password) verification.
-   **State Management**: React Context (`AuthContext`, `WebSocketContext`).

---

## 2. Authentication Flow (Signup to Dashboard)

The application enforces a strict security protocol suitable for an admin panel.

### Step 1: Admin Registration
-   **Route**: `/signup`
-   **Action**: User provides Username, Email, Phone, Password.
-   **Logic**:
    -   Frontend sends data to `/api/auth/register` with `role: 'admin'`.
    -   Backend checks for existing admins. If new, it creates a `SUPER_ADMIN` account.
    -   **Note**: Admin registration acts as a "Direct Commission" and immediately redirects to login.

### Step 2: Login - Credentials
-   **Route**: `/login`
-   **Action**: User enters Username and Password.
-   **Logic**:
    -   Frontend hits `/api/auth/admin-login`.
    -   Backend verifies password.
    -   **Security Event**: Backend generates a **6-character alphanumeric Tactical OTP** (e.g., `X7K9P2`) and logs it to the server console (simulating a secure channel/SMS).
    -   Frontend receives `requiresOtp: true` and switches UI to OTP mode.

### Step 3: Login - OTP Verification
-   **Route**: `/login` (State change)
-   **Action**: User enters the OTP code retrieved from server logs.
-   **Logic**:
    -   Frontend sends `username`, `password`, and `otp` to `/api/auth/admin-login`.
    -   Backend verifies the OTP against the stored hash.
    -   On success, a **JWT Token** and admin user details are returned.
    -   Frontend stores user state in `AuthContext` and redirects to Dashboard.

### Step 4: valid Dashboard Access
-   **Route**: `/` (Protected)
-   **Action**: User lands on the main dashboard.
-   **Security**: `ProtectedRoute` component verifies the user session. If invalid, it kicks the user back to `/login`.

---

## 3. Key Source Code

### A. Frontend Routes (`src/App.jsx`)
Handles the routing structure and protects admin pages.

```jsx
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

                  {/* Protected Admin Routes */}
                  <Route path="/" element={
                      <ProtectedRoute>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="users" element={<Users />} />
                    {/* ... other admin routes */}
                  </Route>
                </Routes>
              </BrowserRouter>
              <Toaster />
            </WebSocketProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
```

### B. Authentication Logic (`src/context/AuthContext.jsx`)
Manages global user state and login/signup functions.

```jsx
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const login = async (username, password) => {
        // 1. Initial Login Request
        const response = await fetch('/api/auth/admin/login', { body: ... });
        const data = await response.json();

        // 2. Handle OTP Requirement
        if (data.requiresOtp) {
            // UI handles this by checking response
            return { requiresOtp: true, ...data }; 
        }

        // 3. Success (if no OTP needed or legacy)
        if (response.ok) {
            setUser(data);
            return { success: true };
        }
    };
    
    // ... verification logic ...
};
```

### C. Backend Controller (`backend/controllers/authController.js`)
Handles the core business logic for admin authentication and OTP generation.

```javascript
export const adminLogin = async (req, res) => {
    const { username, password, otp } = req.body;
    
    // ... fetch admin user ...

    if (admin && (await admin.matchPassword(password))) {
        // --- STEP 1: Generate OTP if not provided ---
        if (!otp) {
            const loginOtp = generateTacticalCode(); // e.g., "A7X29T"
            
            // Store OTP in DB with expiry
            admin.loginOtp = loginOtp;
            await admin.save();

            // Log to console (simulating SMS/Email dispatch)
            console.log(`🎯 LOGIN OTP CODE: ${loginOtp}`);

            return res.status(200).json({
                message: 'OTP sent...',
                requiresOtp: true
            });
        }

        // --- STEP 2: Verify OTP ---
        if (admin.loginOtp !== otp) {
            return res.status(401).json({ message: 'Invalid OTP' });
        }

        // Success: Clear OTP and return Token
        res.json({
            _id: admin._id,
            token: generateToken(admin._id),
            message: 'Admin login verified successfully'
        });
    }
};
```

---

## 4. Admin Features Overview

Once authenticated, the Admin Dashboard provides the following modules:

1.  **Dashboard**: Real-time overview of active users, games, and server health.
2.  **User Management**: View, edit, ban, or verify users.
3.  **Game Moderation**: Monitor active games, force abort/draw, review chat logs.
4.  **Tournaments**: Create and manage chess tournaments.
5.  **Analytics**: Visual reports on user growth and game statistics.
6.  **Reports**: Audit logs and activity tracking.
7.  **Engine**: Configuration for the globally integrated Stockfish engine.
8.  **API Keys**: Manage access for third-party integrations.

