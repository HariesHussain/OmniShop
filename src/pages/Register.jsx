import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { getApiBase } from "@/lib/apiConfig";

export default function Register() {
    const navigate = useNavigate();
    const { user, register, loginWithGoogle, updateProfile, clearAuthError } = useAuth();
    const [step, setStep] = useState("register");
    const [form, setForm] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        full_name: "",
        phone: ""
    });
    const [otp, setOtp] = useState("");
    const [addrForm, setAddrForm] = useState({
        name: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const sanitize = (str, max = 255) => String(str || "").trim().slice(0, max);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        clearAuthError();

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (form.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        if (!form.full_name.trim()) {
            setError("Full name is required");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${getApiBase()}/api/otp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
            
            // Pre-fill address form with registration details
            setAddrForm(prev => ({
                ...prev,
                name: form.full_name,
                phone: form.phone
            }));

            setStep("otp");
        } catch (err) {
            setError(err.message || "Failed to send verification code.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError("");
        if (otp.length !== 6) {
            setError("Please enter a valid 6-digit code");
            return;
        }

        setLoading(true);
        try {
            const verifyRes = await fetch(`${getApiBase()}/api/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email, otp })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Invalid code');

            await register(
                sanitize(form.email, 254),
                form.password.slice(0, 128),
                sanitize(form.full_name)
            );
            
            setStep("address");
        } catch (err) {
            setError(err.message || "Verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        const { name, phone, address, city, state, pincode } = addrForm;

        if (!address || !city || !state || !pincode) {
            setError("Please fill all address fields");
            return;
        }

        setLoading(true);
        try {
            // Save address and phone to user profile
            await updateProfile({
                phone: phone,
                shipping_address: { name, phone, address, city, state, pincode }
            });
            navigate("/");
        } catch (err) {
            setError("Could not save address. You can update it later.");
            navigate("/");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setError("");
        clearAuthError();
        setLoading(true);
        try {
            const newUser = await loginWithGoogle();
            // Google user might already have a profile, but if they just registered, we might want to ask for address
            setStep("address");
        } catch (err) {
            setError("Google sign-up failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const stepTitles = {
        register: "Create your account",
        otp: "Verify your email",
        address: "Add delivery address"
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold">Shop<span className="text-orange-400">Zone</span></h1>
                    <p className="text-muted-foreground mt-2">{stepTitles[step]}</p>
                    <div className="flex justify-center gap-2 mt-3">
                        {["register", "otp", "address"].map((s, i) => (
                            <div
                                key={s}
                                className={`h-1.5 w-16 rounded-full transition-all ${
                                    step === s || 
                                    (step === "otp" && i <= 1) || 
                                    (step === "address" && i <= 2)
                                        ? "bg-orange-400"
                                        : "bg-muted"
                                }`}
                            />
                        ))}
                    </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                    {step === "register" && (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <Label>Full Name</Label>
                                <Input
                                    value={form.full_name}
                                    onChange={e =>
                                        setForm(f => ({ ...f, full_name: e.target.value }))
                                    }
                                    placeholder="John Doe"
                                    maxLength={100}
                                />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="you@email.com"
                                    required
                                    maxLength={254}
                                />
                            </div>
                            <div>
                                <Label>Phone</Label>
                                <Input
                                    type="tel"
                                    value={form.phone}
                                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                    placeholder="10-digit mobile"
                                    maxLength={15}
                                />
                            </div>
                            <div>
                                <Label>Password</Label>
                                <Input
                                    type="password"
                                    value={form.password}
                                    onChange={e =>
                                        setForm(f => ({ ...f, password: e.target.value }))
                                    }
                                    placeholder="Min 8 characters"
                                    required
                                    maxLength={128}
                                />
                            </div>
                            <div>
                                <Label>Confirm Password</Label>
                                <Input
                                    type="password"
                                    value={form.confirmPassword}
                                    onChange={e =>
                                        setForm(f => ({ ...f, confirmPassword: e.target.value }))
                                    }
                                    placeholder="Repeat password"
                                    required
                                    maxLength={128}
                                />
                            </div>
                            {error && (
                                <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">
                                    {error}
                                </p>
                            )}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Send Verification Code"
                                )}
                            </Button>

                            <div className="relative my-2">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">or</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                onClick={handleGoogleRegister}
                                variant="outline"
                                className="w-full gap-2"
                                disabled={loading}
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link
                                    to="/sign-in"
                                    className="text-orange-500 hover:underline font-medium"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    )}

                    {step === "otp" && (
                        <form onSubmit={handleVerifyOtp} className="space-y-4 text-center">
                            <div className="mb-4">
                                <p className="text-sm text-muted-foreground">
                                    We've sent a 6-digit verification code to <br />
                                    <span className="font-semibold text-foreground">{form.email}</span>
                                </p>
                            </div>
                            <div className="flex justify-center">
                                <Input
                                    type="text"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    placeholder="000000"
                                    className="text-center text-2xl tracking-[0.5em] font-bold h-16 w-full max-w-[200px]"
                                    required
                                />
                            </div>
                            {error && (
                                <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2 text-left">
                                    {error}
                                </p>
                            )}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Verify & Continue"
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStep("register")}
                                className="text-sm text-muted-foreground hover:text-orange-500"
                            >
                                Back to registration
                            </Button>
                        </form>
                    )}

                    {step === "address" && (
                        <form onSubmit={handleSaveAddress} className="space-y-3">
                            <div className="mb-4 p-3 bg-muted rounded-lg border border-border">
                                <p className="text-sm font-semibold">{addrForm.name}</p>
                                <p className="text-xs text-muted-foreground">{addrForm.phone}</p>
                            </div>

                            <div>
                                <Label>Address *</Label>
                                <Input
                                    value={addrForm.address}
                                    onChange={e =>
                                        setAddrForm(a => ({ ...a, address: e.target.value }))
                                    }
                                    placeholder="House no, Street, Locality"
                                    maxLength={500}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label>City *</Label>
                                    <Input
                                        value={addrForm.city}
                                        onChange={e =>
                                            setAddrForm(a => ({ ...a, city: e.target.value }))
                                        }
                                        placeholder="City"
                                    />
                                </div>
                                <div>
                                    <Label>State *</Label>
                                    <Input
                                        value={addrForm.state}
                                        onChange={e =>
                                            setAddrForm(a => ({ ...a, state: e.target.value }))
                                        }
                                        placeholder="State"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Pincode *</Label>
                                <Input
                                    value={addrForm.pincode}
                                    onChange={e =>
                                        setAddrForm(a => ({
                                            ...a,
                                            pincode: e.target.value.replace(/\D/g, "")
                                        }))
                                    }
                                    placeholder="6-digit PIN"
                                    maxLength={6}
                                />
                            </div>
                            {error && (
                                <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">
                                    {error}
                                </p>
                            )}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold mt-2"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Save & Continue"
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate("/")}
                                className="w-full text-muted-foreground text-sm"
                            >
                                Skip for now
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}