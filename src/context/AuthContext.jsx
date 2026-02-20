import { createContext, useContext, useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasRegisteredUser, setHasRegisteredUser] = useState(false);

    useEffect(() => {
        const initAuth = () => {
            try {
                const storedUser = localStorage.getItem("chess_admin_user");
                if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
                    const parsed = JSON.parse(storedUser);
                    if (parsed && typeof parsed === 'object') {
                        setUser(parsed);
                    }
                }
            } catch (e) {
                console.error("Auth Session Recovery Failed:", e);
                localStorage.removeItem("chess_admin_user");
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(initAuth, 100);
        return () => clearTimeout(timer);
    }, []);


    const login = async (username, password, role = 'admin', otp = null) => {
        try {
            const endpoint = role === 'admin' ? '/api/auth/admin-login' : '/api/auth/login';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, otp })
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                return { success: false, message: "Server error: Invalid response" };
            }

            if (!response.ok) {
                return { success: false, message: data.message || "Login failed" };
            }

            // If OTP is required, return specialized response
            if (data.requiresOtp) {
                return {
                    success: true,
                    requiresOtp: true,
                    userId: data.userId || data.adminId,
                    email: data.email,
                    phone: data.phone
                };
            }

            const userData = { ...data, role: data.role || role };
            setUser(userData);
            localStorage.setItem("chess_admin_user", JSON.stringify(userData));
            setHasRegisteredUser(true);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const register = async (username, email, phone, password, role = 'admin') => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, phone, password, role })
            });

            let data;
            const text = await response.text();
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Failed to parse JSON response:", text);
                return { success: false, message: "Server error: Invalid response from server" };
            }

            if (!response.ok) {
                return { success: false, message: data.message || "Registration failed" };
            }

            // If admin account created, we don't auto-login anymore as per user request
            if (data.isAdmin) {
                return {
                    success: true,
                    isAdmin: true,
                    message: 'Admin account created successfully. Please login to continue.'
                };
            }

            return {
                success: true,
                requiresVerification: true,
                userId: data.userId,
                email: data.email,
                otp: data.otp
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const verifyOtp = async (userId, otp) => {
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, otp })
            });

            let data;
            const text = await response.text();
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Failed to parse JSON response:", text);
                return { success: false, message: "Server error: Invalid response from server" };
            }

            if (!response.ok) {
                return { success: false, message: data.message || "Verification failed" };
            }

            setHasRegisteredUser(true);
            return { success: true, message: "Account verified successfully. Please login." };

        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const resendOtp = async (email, phone) => {
        try {
            const response = await fetch('/api/auth/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, phone })
            });

            let data;
            const text = await response.text();
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Failed to parse JSON response:", text);
                return { success: false, message: "Server error: Invalid response from server" };
            }

            if (!response.ok) {
                return { success: false, message: data.message || "Failed to resend" };
            }

            return { success: true, message: data.message, otp: data.otp };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("chess_admin_user");
    };

    const updateUser = (userData) => {
        const newUser = { ...user, ...userData };
        setUser(newUser);
        localStorage.setItem("chess_admin_user", JSON.stringify(newUser));
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            register,
            verifyOtp,
            resendOtp,
            updateUser,
            loading,
            hasRegisteredUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <div className="h-16 w-16 rounded-full border-t-2 border-primary animate-spin"></div>
                <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse"></div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40">Synchronizing Chess Master...</p>
        </div>
    );

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirection based on role
        if (user.role === 'player') {
            return <Navigate to="/player" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return children;
};
