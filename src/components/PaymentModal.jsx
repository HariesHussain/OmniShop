import { useState } from "react";
import { Loader2, CreditCard, Smartphone, Globe, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Simulated payment gateway — in production connect to Razorpay/Stripe
export default function PaymentModal({ method, amount, onSuccess, onClose }) {
    const [step, setStep] = useState("form"); // form | processing | success
    const [form, setForm] = useState({ cardNumber: "", expiry: "", cvv: "", name: "", upiId: "", netbankingBank: "" });
    const [error, setError] = useState("");

    const formatCard = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
    const formatExpiry = (v) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; };

    const validate = () => {
        if (method === "Card") {
            const num = form.cardNumber.replace(/\s/g, "");
            if (num.length !== 16) return "Enter valid 16-digit card number";
            if (form.expiry.length !== 5) return "Enter valid expiry MM/YY";
            if (form.cvv.length < 3) return "Enter valid CVV";
            if (!form.name.trim()) return "Enter cardholder name";
        }
        if (method === "UPI") {
            if (!form.upiId.includes("@")) return "Enter valid UPI ID (e.g. name@upi)";
        }
        if (method === "Net Banking") {
            if (!form.netbankingBank) return "Select your bank";
        }
        return null;
    };

    const handlePay = async () => {
        const err = validate();
        if (err) { setError(err); return; }
        setError("");
        setStep("processing");
        // Simulate payment processing
        await new Promise(r => setTimeout(r, 2500));
        // 95% success rate simulation
        if (Math.random() > 0.05) {
            setStep("success");
            setTimeout(() => onSuccess(), 1500);
        } else {
            setStep("form");
            setError("Payment declined. Please try again or use a different method.");
        }
    };

    const BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra", "Punjab National Bank", "Bank of Baroda", "Canara Bank"];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div>
                        <h2 className="font-bold text-lg">Secure Payment</h2>
                        <p className="text-sm text-muted-foreground">Amount: <span className="font-bold text-foreground">₹{amount?.toLocaleString()}</span></p>
                    </div>
                    {step === "form" && <button onClick={onClose}><X className="h-5 w-5" /></button>}
                </div>

                <div className="p-5">
                    {step === "processing" && (
                        <div className="text-center py-12">
                            <Loader2 className="h-14 w-14 animate-spin text-orange-400 mx-auto mb-4" />
                            <p className="font-semibold text-lg">Processing Payment...</p>
                            <p className="text-muted-foreground text-sm mt-1">Please do not close this window</p>
                            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Secured by 256-bit SSL encryption
                            </div>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="text-center py-12">
                            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
                            <p className="font-bold text-xl text-green-600">Payment Successful!</p>
                            <p className="text-muted-foreground text-sm mt-1">₹{amount?.toLocaleString()} paid successfully</p>
                        </div>
                    )}

                    {step === "form" && (
                        <div className="space-y-4">
                            {method === "Card" && (
                                <>
                                    <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl p-4 text-white mb-4">
                                        <div className="flex justify-between items-start mb-6">
                                            <CreditCard className="h-8 w-8 opacity-80" />
                                            <span className="text-xs opacity-60 font-mono">OMNISHOP PAY</span>
                                        </div>
                                        <p className="font-mono text-lg tracking-widest">{form.cardNumber || "•••• •••• •••• ••••"}</p>
                                        <div className="flex justify-between mt-3 text-sm">
                                            <span className="opacity-70">{form.name || "CARD HOLDER"}</span>
                                            <span className="opacity-70">{form.expiry || "MM/YY"}</span>
                                        </div>
                                    </div>
                                    <div><Label>Card Number</Label><Input placeholder="1234 5678 9012 3456" value={form.cardNumber} onChange={e => setForm(f => ({ ...f, cardNumber: formatCard(e.target.value) }))} maxLength={19} /></div>
                                    <div><Label>Cardholder Name</Label><Input placeholder="As on card" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value.slice(0, 50) }))} /></div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><Label>Expiry (MM/YY)</Label><Input placeholder="MM/YY" value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: formatExpiry(e.target.value) }))} maxLength={5} /></div>
                                        <div><Label>CVV</Label><Input placeholder="•••" type="password" value={form.cvv} onChange={e => setForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))} maxLength={4} /></div>
                                    </div>
                                </>
                            )}

                            {method === "UPI" && (
                                <div>
                                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                        <Smartphone className="h-8 w-8 text-green-600" />
                                        <div>
                                            <p className="font-semibold text-green-800">UPI Payment</p>
                                            <p className="text-xs text-green-600">Instant transfer from your bank</p>
                                        </div>
                                    </div>
                                    <Label>UPI ID</Label>
                                    <Input placeholder="yourname@upi or 9876543210@paytm" value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value.slice(0, 50) }))} />
                                    <p className="text-xs text-muted-foreground mt-1">Supports PhonePe, GPay, Paytm, BHIM, etc.</p>
                                </div>
                            )}

                            {method === "Net Banking" && (
                                <div>
                                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                        <Globe className="h-8 w-8 text-blue-600" />
                                        <div>
                                            <p className="font-semibold text-blue-800">Net Banking</p>
                                            <p className="text-xs text-blue-600">Login to your bank account</p>
                                        </div>
                                    </div>
                                    <Label>Select Bank</Label>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {BANKS.map(b => (
                                            <button key={b} type="button" onClick={() => setForm(f => ({ ...f, netbankingBank: b }))}
                                                className={`border rounded-lg p-2 text-xs text-left transition-all ${form.netbankingBank === b ? "border-orange-400 bg-orange-50 font-medium text-orange-700" : "border-border hover:border-orange-300"}`}>
                                                {b}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                                Your payment info is encrypted and secure
                            </div>

                            <Button onClick={handlePay} className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 text-base">
                                Pay ₹{amount?.toLocaleString()} Securely
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}