import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getSellerApps, createSellerApp } from "@/services/firestoreService";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { Loader2, Store, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SellerApply() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [existing, setExisting] = useState(null);
    const [form, setForm] = useState({
        business_name: "", business_type: "", description: "",
        phone: "", gst_number: "", address: ""
    });

    useEffect(() => {
        if (!user) { navigate("/sign-in"); return; }
        checkExisting();
    }, [user]);

    const checkExisting = async () => {
        try {
            const apps = await getSellerApps(user.email);
            if (apps.length > 0) setExisting(apps[0]);
        } catch (error) {
            console.error("Failed to check existing application:", error);
            toast.error("Failed to load application status");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.business_name || !form.description || !form.phone) {
            toast.error("Please fill all required fields"); return;
        }
        setLoading(true);
        try {
            await createSellerApp({
                ...form,
                applicant_email: user.email,
                applicant_name: user.full_name || user.email,
                status: "pending"
            });
            setSubmitted(true);
        } catch (error) {
            console.error("Failed to submit seller application:", error);
            toast.error("Failed to submit application");
        }
        setLoading(false);
    };

    if (existing || submitted) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-lg mx-auto px-4 py-20 text-center">
                {existing?.status === "approved" ? (
                    <>
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-2 text-green-700">Application Approved!</h1>
                        <p className="text-muted-foreground mb-6">You're now a verified seller. Start listing your products.</p>
                        <Button onClick={() => navigate("/seller/dashboard")} className="bg-orange-400 hover:bg-orange-500 text-white">Go to Seller Dashboard</Button>
                    </>
                ) : existing?.status === "rejected" ? (
                    <>
                        <div className="text-5xl mb-4">❌</div>
                        <h1 className="text-2xl font-bold mb-2 text-red-600">Application Rejected</h1>
                        <p className="text-muted-foreground mb-2">{existing.admin_note || "Your application didn't meet our requirements."}</p>
                        <p className="text-sm text-muted-foreground">Contact support for more information.</p>
                    </>
                ) : (
                    <>
                        <div className="text-5xl mb-4">⏳</div>
                        <h1 className="text-2xl font-bold mb-2">Application Under Review</h1>
                        <p className="text-muted-foreground mb-2">We'll review your application within 2-3 business days and notify you via email.</p>
                        <p className="text-sm text-muted-foreground">Status: <span className="font-semibold text-orange-500 capitalize">{existing?.status || "pending"}</span></p>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <Store className="h-8 w-8 text-orange-400" />
                    <div>
                        <h1 className="text-2xl font-bold">Seller Application</h1>
                        <p className="text-muted-foreground text-sm">Fill out the form to start selling on OmniShop</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <div>
                        <Label>Business Name *</Label>
                        <Input value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value.slice(0, 100) }))} placeholder="Your shop or brand name" required />
                    </div>
                    <div>
                        <Label>Business Type *</Label>
                        <select value={form.business_type} onChange={e => setForm(f => ({ ...f, business_type: e.target.value }))}
                            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background mt-1">
                            <option value="">Select type</option>
                            {["Individual/Freelancer", "Sole Proprietorship", "Partnership", "Private Limited", "LLP", "Other"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label>Contact Phone *</Label>
                        <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 15) }))} placeholder="Mobile number" required />
                    </div>
                    <div>
                        <Label>GST Number (if applicable)</Label>
                        <Input value={form.gst_number} onChange={e => setForm(f => ({ ...f, gst_number: e.target.value.toUpperCase().slice(0, 15) }))} placeholder="15-digit GSTIN" />
                    </div>
                    <div>
                        <Label>Business Address</Label>
                        <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value.slice(0, 300) }))} placeholder="Full business address" />
                    </div>
                    <div>
                        <Label>Tell us about your business *</Label>
                        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value.slice(0, 1000) }))}
                            placeholder="What products do you sell? How long have you been in business? Why do you want to sell on OmniShop?"
                            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background min-h-28 resize-none mt-1" required />
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-sm text-orange-700">
                        By submitting, you agree to OmniShop's seller terms and policies. We may contact you for verification.
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold">
                        {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : "Submit Application"}
                    </Button>
                </form>
            </div>
        </div>
    );
}