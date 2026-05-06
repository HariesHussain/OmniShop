import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Firebase passes oobCode and apiKey in the URL
    const query = new URLSearchParams(location.search);
    const oobCode = query.get("oobCode");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState("");

    useEffect(() => {
        if (!oobCode) {
            setError("Invalid or expired reset link. Please request a new one.");
            setVerifying(false);
            return;
        }

        // Verify the code is valid before showing the form
        verifyPasswordResetCode(auth, oobCode)
            .then((email) => {
                setEmail(email);
                setVerifying(false);
            })
            .catch((err) => {
                console.error("Verification error:", err);
                setError("This password reset link has expired or has already been used.");
                setVerifying(false);
            });
    }, [oobCode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            await confirmPasswordReset(auth, oobCode, password);
            setSuccess(true);
            toast.success("Password reset successful!");
            setTimeout(() => navigate("/sign-in"), 3000);
        } catch (err) {
            console.error("Reset error:", err);
            setError(err.message || "Failed to reset password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold">Shop<span className="text-orange-400">Zone</span></h1>
                    <p className="text-muted-foreground mt-2">Reset your account password</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <CheckCircle className="h-16 w-16 text-green-500" />
                            </div>
                            <h2 className="text-xl font-bold">Password Updated!</h2>
                            <p className="text-muted-foreground">
                                Your password has been changed successfully. Redirecting you to sign in...
                            </p>
                            <Button 
                                onClick={() => navigate("/sign-in")} 
                                className="w-full bg-orange-400 hover:bg-orange-500 text-white"
                            >
                                Sign In Now
                            </Button>
                        </div>
                    ) : error ? (
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <AlertCircle className="h-16 w-16 text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold">Link Expired</h2>
                            <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                                {error}
                            </p>
                            <Button 
                                onClick={() => navigate("/sign-in")} 
                                className="w-full bg-orange-400 hover:bg-orange-500 text-white"
                            >
                                Back to Sign In
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="mb-4">
                                <p className="text-sm text-muted-foreground">
                                    Resetting password for: <br />
                                    <span className="font-semibold text-foreground">{email}</span>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min 8 characters"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat your password"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold mt-2"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                Remember your password?{" "}
                                <Link to="/sign-in" className="text-orange-500 hover:underline font-medium">
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
