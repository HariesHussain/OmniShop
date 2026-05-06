import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getSellerApps, createSellerApp, getDeliveryApps, createDeliveryApp, updateUserProfile } from "@/services/firestoreService";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { User, Lock, Store, Trash2, Loader2, ChevronRight, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Settings() {
    const { user, resetPassword } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState("profile");
    const [profile, setProfile] = useState({ full_name: "", phone: "" });
    const [addr, setAddr] = useState({ name: "", phone: "", address: "", city: "", state: "", pincode: "" });
    const [resetSent, setResetSent] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [sellerApp, setSellerApp] = useState(null);
    const [deliveryApp, setDeliveryApp] = useState(null);
    const [sellerForm, setSellerForm] = useState({ business_name: "", business_type: "", phone: "", description: "", gst_number: "", address: "" });
    const [deliveryForm, setDeliveryForm] = useState({ phone: "", vehicle_type: "Bike", area: "", experience: "" });

    useEffect(() => {
        if (!user) { navigate("/sign-in"); return; }
        loadProfile();
        loadApplications();
    }, [user]);

    const loadApplications = async () => {
        try {
            const [sApps, dApps] = await Promise.all([
                getSellerApps(user.email),
                getDeliveryApps(user.email),
            ]);
            if (sApps.length > 0) setSellerApp(sApps[0]);
            if (dApps.length > 0) setDeliveryApp(dApps[0]);
        } catch (error) {
            console.error("Failed to load applications:", error);
        }
    };

    const submitSellerApp = async () => {
        if (!sellerForm.business_name || !sellerForm.description) { toast.error("Fill required fields"); return; }
        setLoading(true);
        try {
            await createSellerApp({
                applicant_email: user.email, applicant_name: user.full_name || user.email,
                ...sellerForm, status: "pending"
            });
            toast.success("Seller application submitted! We'll review within 2-3 days.");
            loadApplications();
        } catch (error) {
            console.error("Failed to submit seller app:", error);
            toast.error("Failed to submit application");
        }
        setLoading(false);
    };

    const submitDeliveryApp = async () => {
        if (!deliveryForm.phone || !deliveryForm.area) { toast.error("Fill required fields"); return; }
        setLoading(true);
        try {
            await createDeliveryApp({
                applicant_email: user.email, applicant_name: user.full_name || user.email,
                ...deliveryForm, status: "pending"
            });
            toast.success("Delivery partner application submitted!");
            loadApplications();
        } catch (error) {
            console.error("Failed to submit delivery app:", error);
            toast.error("Failed to submit application");
        }
        setLoading(false);
    };

    const loadProfile = async () => {
        try {
            setProfile({ full_name: user.full_name || "", phone: user.phone || "" });
            if (user.shipping_address) setAddr(user.shipping_address);
        } catch (error) {
            console.error("Failed to load profile:", error);
            toast.error("Failed to load profile");
        }
    };

    const saveProfile = async () => {
        setLoading(true);
        try {
            await updateUserProfile(user.uid, { phone: profile.phone, shipping_address: addr });
            toast.success("Profile updated!");
        } catch (error) {
            console.error("Failed to save profile:", error);
            toast.error("Failed to save profile");
        }
        setLoading(false);
    };

    const sendPasswordReset = async () => {
        setLoading(true);
        try {
            await resetPassword(user.email);
            toast.success("Password reset link sent to your email.");
            setResetSent(true);
        } catch (error) {
            console.error("Failed to send reset email:", error);
            toast.error("Failed to send password reset email");
        }
        setLoading(false);
    };

    const requestAccountDeletion = async () => {
        if (deleteConfirm !== "DELETE") { toast.error('Type DELETE to confirm'); return; }
        setLoading(true);
        try {
            await updateUserProfile(user.uid, { account_deletion_requested: true });
            toast.success("Account deletion request submitted. Our team will process it within 7 days.");
        } catch (error) {
            console.error("Failed to request account deletion:", error);
            toast.error("Failed to process deletion request");
        }
        setLoading(false);
        setDeleteConfirm("");
    };

    const TABS = [
        { id: "profile", label: "Profile & Address", icon: User },
        { id: "password", label: "Password", icon: Lock },
        { id: "seller", label: user?.role === "seller" ? "Seller Status" : "Become a Seller", icon: Store },
        { id: "delivery", label: user?.role === "delivery_boy" ? "Delivery Status" : "Become Delivery Partner", icon: Truck },
        { id: "danger", label: "Account", icon: Shield },
    ];

    if (!user) return null;

    const canReapply = (app) => {
        if (!app || app.status !== "rejected") return false;
        const rejectedDate = app.updated_at?.toMillis ? app.updated_at.toMillis() : new Date(app.updated_at || 0).getTime();
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
        return Date.now() - rejectedDate > twoDaysMs;
    };

    const getAppStatusDisplay = (app, role, targetRole) => {
        if (role === targetRole) return "approved";
        if (!app) return "none";
        return app.status; // "pending" or "rejected"
    };

    const sellerStatus = getAppStatusDisplay(sellerApp, user?.role, "seller");
    const deliveryStatus = getAppStatusDisplay(deliveryApp, user?.role, "delivery_boy");

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Sidebar */}
                    <div className="sm:w-56 flex-shrink-0">
                        <nav className="bg-card border border-border rounded-xl overflow-hidden">
                            {TABS.map(t => {
                                const Icon = t.icon;
                                return (
                                    <button key={t.id} onClick={() => setTab(t.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium border-b border-border last:border-0 transition-colors text-left ${tab === t.id ? "bg-orange-50 text-orange-600" : "hover:bg-muted"}`}>
                                        <Icon className="h-4 w-4" />
                                        {t.label}
                                        <ChevronRight className="h-3 w-3 ml-auto" />
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-card border border-border rounded-xl p-6">
                        {tab === "profile" && (
                            <div className="space-y-4">
                                <h2 className="font-bold text-lg mb-4">Profile Information</h2>
                                <div><Label>Full Name</Label>
                                    <Input value={profile.full_name} disabled className="bg-muted text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground mt-1">Name cannot be changed. Contact support if needed.</p>
                                </div>
                                <div><Label>Email</Label><Input value={user.email} disabled className="bg-muted text-muted-foreground" /></div>
                                <div><Label>Phone</Label><Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 15) }))} placeholder="10-digit mobile" /></div>
                                <h2 className="font-bold text-lg pt-4 border-t border-border mt-4">Default Delivery Address</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2"><Label>Full Name</Label><Input value={addr.name} onChange={e => setAddr(a => ({ ...a, name: e.target.value }))} /></div>
                                    <div className="col-span-2"><Label>Phone</Label><Input value={addr.phone} onChange={e => setAddr(a => ({ ...a, phone: e.target.value }))} /></div>
                                    <div className="col-span-2"><Label>Address</Label><Input value={addr.address} onChange={e => setAddr(a => ({ ...a, address: e.target.value }))} /></div>
                                    <div><Label>City</Label><Input value={addr.city} onChange={e => setAddr(a => ({ ...a, city: e.target.value }))} /></div>
                                    <div><Label>State</Label><Input value={addr.state} onChange={e => setAddr(a => ({ ...a, state: e.target.value }))} /></div>
                                    <div><Label>Pincode</Label><Input value={addr.pincode} onChange={e => setAddr(a => ({ ...a, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} /></div>
                                </div>
                                <Button onClick={saveProfile} disabled={loading} className="bg-orange-400 hover:bg-orange-500 text-white">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                                </Button>
                            </div>
                        )}

                        {tab === "password" && (
                            <div>
                                <h2 className="font-bold text-lg mb-4">Change Password</h2>
                                <p className="text-sm text-muted-foreground mb-6">
                                    We'll send a secure password reset link to <strong>{user.email}</strong>. Click the link in the email to set a new password.
                                </p>
                                {resetSent ? (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm">
                                        ✅ Reset email sent! Check your inbox at <strong>{user.email}</strong>
                                    </div>
                                ) : (
                                    <Button onClick={sendPasswordReset} disabled={loading} className="bg-orange-400 hover:bg-orange-500 text-white">
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Password Reset Email"}
                                    </Button>
                                )}
                            </div>
                        )}

                        {tab === "seller" && (
                            <div>
                                {sellerStatus === "approved" ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Store className="h-8 w-8 text-green-600" />
                                        </div>
                                        <h2 className="font-bold text-lg mb-2">You're an Approved Seller! 🎉</h2>
                                        <p className="text-muted-foreground text-sm mb-4">Your seller account is active. Start listing products.</p>
                                        <Link to="/seller/dashboard"><Button className="bg-orange-400 hover:bg-orange-500 text-white">Go to Seller Dashboard</Button></Link>
                                    </div>
                                ) : (sellerStatus === "pending" || (sellerStatus === "rejected" && !canReapply(sellerApp))) ? (
                                    <div className="text-center py-8">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${sellerStatus === "pending" ? "bg-yellow-100" : "bg-red-100"}`}>
                                            <Store className={`h-8 w-8 ${sellerStatus === "pending" ? "text-yellow-600" : "text-red-600"}`} />
                                        </div>
                                        <h2 className="font-bold text-lg mb-2">{sellerStatus === "pending" ? "Application Under Review" : "Application Rejected"}</h2>
                                        <p className="text-muted-foreground text-sm">
                                            {sellerStatus === "pending" 
                                                ? "Our team will review your application within 2-3 business days." 
                                                : `Your application was not approved. ${sellerApp?.admin_note || ""} You can re-apply after 2 days of rejection.`}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <h2 className="font-bold text-lg">Apply to Become a Seller</h2>
                                        {sellerStatus === "rejected" && (
                                            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4">
                                                Previous application was rejected. You can now re-apply with updated details.
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="col-span-2"><Label>Business Name *</Label><Input value={sellerForm.business_name} onChange={e => setSellerForm(f => ({ ...f, business_name: e.target.value }))} placeholder="Your shop name" /></div>
                                            <div><Label>Business Type</Label><Input value={sellerForm.business_type} onChange={e => setSellerForm(f => ({ ...f, business_type: e.target.value }))} placeholder="e.g. Retail, Manufacturer" /></div>
                                            <div><Label>Phone *</Label><Input value={sellerForm.phone} onChange={e => setSellerForm(f => ({ ...f, phone: e.target.value }))} placeholder="Contact number" /></div>
                                            <div><Label>GST Number</Label><Input value={sellerForm.gst_number} onChange={e => setSellerForm(f => ({ ...f, gst_number: e.target.value }))} placeholder="Optional" /></div>
                                            <div><Label>Business Address</Label><Input value={sellerForm.address} onChange={e => setSellerForm(f => ({ ...f, address: e.target.value }))} placeholder="City, State" /></div>
                                            <div className="col-span-2"><Label>Business Description *</Label><textarea value={sellerForm.description} onChange={e => setSellerForm(f => ({ ...f, description: e.target.value }))} placeholder="What do you sell? Tell us about your business..." className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background min-h-20 resize-none mt-1" /></div>
                                        </div>
                                        <Button onClick={submitSellerApp} disabled={loading} className="bg-orange-400 hover:bg-orange-500 text-white gap-2">
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Store className="h-4 w-4" /> {sellerStatus === "rejected" ? "Re-apply Now" : "Submit Application"}</>}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {tab === "delivery" && (
                            <div>
                                {deliveryStatus === "approved" ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Truck className="h-8 w-8 text-green-600" />
                                        </div>
                                        <h2 className="font-bold text-lg mb-2">You're an Active Delivery Partner! 🚚</h2>
                                        <p className="text-muted-foreground text-sm mb-4">Accept and manage deliveries from your dashboard.</p>
                                        <Link to="/delivery"><Button className="bg-orange-400 hover:bg-orange-500 text-white">Open Delivery Dashboard</Button></Link>
                                    </div>
                                ) : (deliveryStatus === "pending" || (deliveryStatus === "rejected" && !canReapply(deliveryApp))) ? (
                                    <div className="text-center py-8">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${deliveryStatus === "pending" ? "bg-yellow-100" : "bg-red-100"}`}>
                                            <Truck className={`h-8 w-8 ${deliveryStatus === "pending" ? "text-yellow-600" : "text-red-600"}`} />
                                        </div>
                                        <h2 className="font-bold text-lg mb-2">{deliveryStatus === "pending" ? "Application Under Review" : "Application Rejected"}</h2>
                                        <p className="text-muted-foreground text-sm">
                                            {deliveryStatus === "pending" 
                                                ? "Our admin team will review your application soon." 
                                                : `Your application was not approved. ${deliveryApp?.admin_note || ""} You can re-apply after 2 days of rejection.`}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <h2 className="font-bold text-lg">Apply as Delivery Partner</h2>
                                        {deliveryStatus === "rejected" && (
                                            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4">
                                                Previous application was rejected. You can now re-apply with updated details.
                                            </div>
                                        )}
                                        <p className="text-sm text-muted-foreground">Earn money delivering orders in your area. Flexible timings, daily earnings.</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div><Label>Phone *</Label><Input value={deliveryForm.phone} onChange={e => setDeliveryForm(f => ({ ...f, phone: e.target.value }))} placeholder="Your mobile number" /></div>
                                            <div><Label>Vehicle Type *</Label>
                                                <select value={deliveryForm.vehicle_type} onChange={e => setDeliveryForm(f => ({ ...f, vehicle_type: e.target.value }))} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background">
                                                    {["Bike", "Scooter", "Cycle", "Car", "Van"].map(v => <option key={v} value={v}>{v}</option>)}
                                                </select>
                                            </div>
                                            <div><Label>Delivery Area *</Label><Input value={deliveryForm.area} onChange={e => setDeliveryForm(f => ({ ...f, area: e.target.value }))} placeholder="City / Neighbourhood" /></div>
                                            <div><Label>Experience</Label><Input value={deliveryForm.experience} onChange={e => setDeliveryForm(f => ({ ...f, experience: e.target.value }))} placeholder="e.g. 2 years delivery" /></div>
                                        </div>
                                        <Button onClick={submitDeliveryApp} disabled={loading} className="bg-orange-400 hover:bg-orange-500 text-white gap-2">
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Truck className="h-4 w-4" /> {deliveryStatus === "rejected" ? "Re-apply Now" : "Submit Application"}</>}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {tab === "danger" && (
                            <div>
                                <h2 className="font-bold text-lg mb-4">Account Management</h2>
                                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                                    <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2"><Trash2 className="h-4 w-4" /> Delete Account</h3>
                                    <p className="text-sm text-red-600 mb-4">
                                        This will permanently delete your account, order history, and all personal data. This action cannot be undone.
                                    </p>
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-red-700">Type <strong>DELETE</strong> to confirm</Label>
                                            <Input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETE" className="border-red-300 mt-1" />
                                        </div>
                                        <Button onClick={requestAccountDeletion} disabled={loading || deleteConfirm !== "DELETE"}
                                            className="bg-red-600 hover:bg-red-700 text-white">
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request Account Deletion"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
