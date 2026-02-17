import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import { LegalDialog } from "@/components/legal/LegalDialog";

const Login = () => {
    const [role, setRole] = useState("player");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState("credentials");
    const [userId, setUserId] = useState(null);
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    useEffect(() => {
        if (user) {
            navigate("/", { replace: true });
        }
    }, [user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const loginOtp = step === "otp" ? otp : null;
            const result = await login(username, password, role, loginOtp);

            if (result.success) {
                if (result.requiresOtp) {
                    setUserId(result.userId);
                    setStep("otp");
                    toast.success("Security code dispatched! Verification required.");
                } else {
                    toast.success(role === "admin" ? "Welcome back, Commander." : "Welcome back to the Arena!");
                    const targetPath = role === "player" ? "/player" : from;
                    navigate(targetPath, { replace: true });
                }
            } else {
                toast.error(result.message || "Access denied.");
            }
        } catch (error) {
            toast.error("Nexus connection unstable. Try again.");
        }
    };

    const handleBack = () => {
        setStep("credentials");
        setOtp("");
        setUserId(null);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 p-6 z-50">
                <ModeToggle />
            </div>
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -ml-48 -mt-48 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -mr-48 -mb-48"></div>
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none chess-grid"></div>

            <Card className="w-full max-w-[440px] bg-card/40 backdrop-blur-2xl border border-border rounded-[2rem] relative z-10 p-2 shadow-2xl transition-all border-t-white/10">
                <CardHeader className="space-y-4 pt-12 px-10 text-center">
                    <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center relative bg-white/5 border border-white/10 shadow-lg mb-4">
                        <img src="/nexus_chess_logo.png" alt="ChessMaster" className="w-10 h-10 object-contain" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-3xl font-bold tracking-tight">
                            {step === "credentials" ? (role === "admin" ? "Admin Access" : "Welcome Back") : "Verify Identity"}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">
                            {step === "credentials"
                                ? (role === "admin" ? "Secure administrative portal" : "Enter your credentials to enter the arena")
                                : "Check backend terminal for OTP code"}
                        </CardDescription>
                    </div>

                    {step === "credentials" && (
                        <div className="flex p-1 bg-secondary/30 rounded-xl max-w-[240px] mx-auto mt-4 border border-border/50">
                            <button
                                type="button"
                                onClick={() => setRole("player")}
                                className={cn(
                                    "flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all",
                                    role === "player" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                PLAYER
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("admin")}
                                className={cn(
                                    "flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all",
                                    role === "admin" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                ADMIN
                            </button>
                        </div>
                    )}
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-6 px-10 pt-4 pb-2">
                        {step === "credentials" ? (
                            <>
                                <div className="space-y-2 group">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Username</Label>
                                    <Input
                                        placeholder="Enter username..."
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="h-12 rounded-xl border-border bg-secondary/20 focus:bg-background focus:ring-primary/20 focus:border-primary/30 text-md font-medium"
                                        required
                                    />
                                </div>
                                <div className="space-y-2 group">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Password</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 rounded-xl border-border bg-secondary/20 focus:bg-background focus:ring-primary/20 focus:border-primary/30 font-medium"
                                        required
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2 group">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">OTP Code</Label>
                                <Input
                                    placeholder="Enter 6-character OTP..."
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.toUpperCase())}
                                    maxLength={6}
                                    className="h-12 rounded-xl border-border bg-secondary/20 focus:bg-background focus:ring-primary/20 focus:border-primary/30 text-center text-2xl font-bold tracking-widest"
                                    required
                                />
                                <p className="text-xs text-muted-foreground text-center pt-2">Check backend terminal for the OTP code</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-6 px-10 pb-12 pt-8">
                        {step === "credentials" ? (
                            <Button className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-md flex items-center justify-center gap-2 group hover:brightness-110 transition-all shadow-lg hover:shadow-primary/25" type="submit">
                                {role === "admin" ? "Send Admin OTP" : "Sign In"} <Unlock className="w-4 h-4 ml-1 opacity-70" />
                            </Button>
                        ) : (
                            <div className="space-y-3 w-full">
                                <Button className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-md flex items-center justify-center gap-2 group hover:brightness-110 transition-all shadow-lg hover:shadow-primary/25" type="submit">
                                    Verify & Login <Unlock className="w-4 h-4 ml-1 opacity-70" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-12 rounded-xl"
                                    onClick={handleBack}
                                >
                                    Back
                                </Button>
                            </div>
                        )}

                        <div className="text-center space-y-4">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                                Protected by ChessMaster Security
                            </p>
                            {step === "credentials" && (
                                <p className="text-sm font-medium text-muted-foreground">
                                    No account?{" "}
                                    <Link to="/signup" className="text-primary hover:text-foreground transition-colors underline underline-offset-4">
                                        Sign up
                                    </Link>
                                </p>
                            )}
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default Login;
