import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LegalDialog } from "@/components/legal/LegalDialog";
import { Rocket, ShieldCheck, Zap, ArrowRight, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";

const SignUp = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [step, setStep] = useState(1);
    const [userId, setUserId] = useState(null);
    const [role, setRole] = useState("player");
    const [isClearing, setIsClearing] = useState(false);
    const [isError, setIsError] = useState(false);
    const [timer, setTimer] = useState(0);
    const { register, verifyOtp, resendOtp, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => setTimer((t) => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    useEffect(() => {
        if (user) {
            navigate("/", { replace: true });
        }
    }, [user, navigate]);

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsError(false);
        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            setIsError(true);
            return;
        }

        const result = await register(username, email, phone, password, role);
        if (result.success) {
            if (role === "admin") {
                setIsClearing(true);
                toast.success(result.message || "Admin account created! Redirecting to login...");
                setTimeout(() => {
                    setIsClearing(false);
                    navigate("/login", { replace: true });
                }, 2000);
            } else {
                setUserId(result.userId);
                setStep(2);
                toast.success("Account created! Please verify your OTP.");
            }
        } else {
            toast.error(result.message || "Registration failed.");
            setIsError(true);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        const result = await resendOtp(email, phone);
        if (result.success) {
            toast.success(result.message || "OTP resent successfully.");
            if (result.otp) console.log("New OTP:", result.otp);
            setTimer(60);
            setOtp(["", "", "", "", "", ""]);
            setTimeout(() => document.getElementById("otp-0")?.focus(), 100);
        } else {
            toast.error(result.message || "Failed to resend OTP.");
        }
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) value = value.slice(-1);
        const newOtp = [...otp];
        newOtp[index] = value.toUpperCase();
        setOtp(newOtp);

        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`).focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setIsError(false);
        const fullOtp = otp.join("");
        if (fullOtp.length < 6) {
            toast.error("Please enter the complete OTP.");
            setIsError(true);
            return;
        }

        const result = await verifyOtp(userId, fullOtp);
        if (result.success) {
            toast.success("Account Verified. Please login.");
            navigate("/login");
        } else {
            toast.error(result.message || "Invalid OTP.");
            setIsError(true);
            setOtp(["", "", "", "", "", ""]);
            document.getElementById("otp-0")?.focus();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden font-outfit">
            {/* Background elements */}
            <div className="absolute top-0 right-0 p-6 z-50">
                <ModeToggle />
            </div>
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -ml-48 -mt-48 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -mr-48 -mb-48"></div>
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none chess-grid"></div>

            <Card className={cn(
                "w-full max-w-[500px] bg-card/40 backdrop-blur-2xl border border-border rounded-[2rem] relative z-10 p-2 shadow-2xl transition-all border-t-white/10",
                isError ? "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : ""
            )}>
                {isClearing ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
                        <Loader2 className="h-16 w-16 text-primary animate-spin" />
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold tracking-tight">Processing</h2>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">Creating your account...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <CardHeader className="space-y-4 pt-10 px-8 text-center">
                            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center relative bg-white/5 border border-white/10 shadow-lg">
                                <img src="/nexus_chess_logo.png" alt="ChessMaster" className="w-8 h-8 object-contain" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-3xl font-bold tracking-tight">
                                    {step === 1 ? "Create Account" : "Verify OTP"}
                                </CardTitle>
                                <CardDescription className="text-muted-foreground font-medium">
                                    {step === 1 ? "Enter your details to register" : "Enter the 6-digit code sent to you"}
                                </CardDescription>
                            </div>

                            {step === 1 && (
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

                        {step === 1 ? (
                            <form onSubmit={handleRegister}>
                                <CardContent className="space-y-5 px-8 pt-4 pb-2">
                                    <div className="space-y-2 group">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Username</Label>
                                        <Input
                                            placeholder="Username..."
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="h-12 rounded-xl border-border bg-secondary/20 focus:bg-background focus:ring-primary/20 transition-all text-foreground"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 group">
                                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Email</Label>
                                            <Input
                                                type="email"
                                                placeholder="email@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="h-12 rounded-xl border-border bg-secondary/20 focus:bg-background focus:ring-primary/20 transition-all text-foreground"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2 group">
                                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Phone</Label>
                                            <Input
                                                placeholder="+1 000..."
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="h-12 rounded-xl border-border bg-secondary/20 focus:bg-background focus:ring-primary/20 transition-all text-foreground"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 group">
                                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Password</Label>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="h-12 rounded-xl border-border bg-secondary/20 focus:bg-background focus:ring-primary/20 transition-all text-foreground"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2 group">
                                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Confirm</Label>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="h-12 rounded-xl border-border bg-secondary/20 focus:bg-background focus:ring-primary/20 transition-all text-foreground"
                                                required
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col space-y-6 px-8 pb-10 pt-8">
                                    <Button className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-md shadow-lg hover:shadow-primary/25 transition-all" type="submit">
                                        Sign Up <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>

                                    <div className="text-center space-y-4">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                            Already have an account?{" "}
                                            <Link to="/login" className="text-primary hover:text-foreground transition-colors underline underline-offset-4">
                                                Sign In
                                            </Link>
                                        </p>
                                    </div>
                                </CardFooter>
                            </form>
                        ) : (
                            <form onSubmit={handleVerify}>
                                <CardContent className="space-y-8 px-8 pt-8 pb-4">
                                    <div className="flex justify-between gap-2">
                                        {otp.map((digit, index) => (
                                            <Input
                                                key={index}
                                                id={`otp-${index}`}
                                                type="text"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(index, e)}
                                                className="w-12 h-14 text-center text-xl font-bold bg-secondary/20 border-border rounded-xl focus:ring-primary/20 transition-all"
                                                required
                                            />
                                        ))}
                                    </div>

                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            disabled={timer > 0}
                                            className={cn(
                                                "text-xs font-bold uppercase tracking-widest transition-all",
                                                timer > 0 ? "text-muted-foreground" : "text-primary hover:text-foreground"
                                            )}
                                        >
                                            {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
                                        </button>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col space-y-6 px-8 pb-10 pt-4">
                                    <Button className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-md shadow-lg hover:shadow-primary/25 transition-all" type="submit">
                                        Verify Identity <ShieldCheck className="w-4 h-4 ml-2" />
                                    </Button>

                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-[10px] text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
                                    >
                                        Back to Info
                                    </button>
                                </CardFooter>
                            </form>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
};
export default SignUp;
