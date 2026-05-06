import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/firebase/firebaseConfig";
import { getDeliveryAssignments, updateDeliveryAssignment, updateOrder, createNotification } from "@/services/firestoreService";
import Navbar from "@/components/Navbar";
import { getApiBase } from "@/lib/apiConfig";
import { toast } from "sonner";
import { Loader2, MapPin, Package, CheckCircle, Phone, IndianRupee, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_FLOW = ["assigned", "picked_up", "out_for_delivery", "delivered"];
const STATUS_LABEL = {
    assigned: "Assigned",
    picked_up: "Picked Up",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    failed: "Failed",
};
const STATUS_COLOR = {
    assigned: "bg-yellow-100 text-yellow-700",
    picked_up: "bg-blue-100 text-blue-700",
    out_for_delivery: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
};

const notifyOrderStatus = async (orderId, status) => {
    const token = await auth.currentUser.getIdToken();
    await fetch(`${getApiBase()}/api/orders/${orderId}/status`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
    });
};

export default function DeliveryDashboard() {
    const { user, isLoadingAuth } = useAuth();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [tab, setTab] = useState("active");
    const [otpInputs, setOtpInputs] = useState({});

    useEffect(() => {
        if (isLoadingAuth) return;
        if (!user) { navigate("/sign-in"); return; }
        if (user.role !== "delivery_boy" && user.role !== "admin") { 
            navigate("/"); 
            toast.error("Delivery access only"); 
            return; 
        }
        loadAssignments();
    }, [user, isLoadingAuth]);

    const loadAssignments = async () => {
        setLoading(true);
        try {
            const data = await getDeliveryAssignments(user.email);
            const sorted = (data || []).sort((a, b) => {
                const aTime = a['created_date']?.toMillis ? a['created_date'].toMillis() : new Date(a['created_date'] || 0).getTime();
                const bTime = b['created_date']?.toMillis ? b['created_date'].toMillis() : new Date(b['created_date'] || 0).getTime();
                return bTime - aTime;
            });
            setAssignments(sorted);
        } catch (error) {
            console.error("Failed to load assignments:", error);
            toast.error("Failed to load assignments");
        }
        setLoading(false);
    };

    const advanceStatus = async (assignment) => {
        const currentIdx = STATUS_FLOW.indexOf(assignment.status);
        if (currentIdx === -1 || currentIdx >= STATUS_FLOW.length - 1) return;
        const nextStatus = STATUS_FLOW[currentIdx + 1];

        // If delivering COD, require OTP confirmation
        if (nextStatus === "delivered" && assignment.payment_method === "COD") {
            const enteredOtp = otpInputs[assignment.id];
            if (!enteredOtp || enteredOtp !== assignment.otp) {
                toast.error("Enter the correct OTP from customer to confirm delivery");
                return;
            }
        }

        let otp = null;
        if (nextStatus === "out_for_delivery" && assignment.payment_method === "COD") {
            otp = Math.floor(1000 + Math.random() * 9000).toString();
        }

        setUpdating(assignment.id);
        try {
            await updateDeliveryAssignment(assignment.id, {
                status: nextStatus,
                ...(otp && { otp }),
                cod_collected: nextStatus === "delivered" && assignment.payment_method === "COD",
            });

            // Update the parent order status too
            if (nextStatus === "delivered") {
                await updateOrder(assignment.order_id, {
                    status: "delivered",
                    payment_status: assignment.payment_method === "COD" ? "paid" : "paid",
                });
                await notifyOrderStatus(assignment.order_id, "delivered");
                // Send notification to buyer
                await createNotification({
                    user_email: assignment.buyer_email,
                    title: "✅ Order Delivered!",
                    message: `Your order has been delivered. Thank you for shopping with OmniShop!`,
                    type: "order",
                    is_read: false,
                });
                toast.success("Order marked as delivered!");
            } else if (nextStatus === "out_for_delivery") {
                await updateOrder(assignment.order_id, { status: "shipped" });
                await notifyOrderStatus(assignment.order_id, "shipped");
                if (otp) {
                    await sendDeliveryOtpEmail(assignment, otp);
                }
            }
            loadAssignments();
        } catch (error) {
            console.error("Failed to advance status:", error);
            toast.error("Failed to update status");
        }
        setUpdating(null);
    };

    const markFailed = async (assignment) => {
        setUpdating(assignment.id);
        try {
            await updateDeliveryAssignment(assignment.id, { status: "failed" });
            await updateOrder(assignment.order_id, { status: "confirmed" });
            await notifyOrderStatus(assignment.order_id, "confirmed");
            toast.success("Marked as failed — order sent back to confirmed");
            loadAssignments();
        } catch (error) {
            console.error("Failed to mark as failed:", error);
            toast.error("Failed to mark as failed");
        }
        setUpdating(null);
    };

    const sendDeliveryOtpEmail = async (assignment, otp) => {
        toast.info("Sending OTP email to customer...");
        try {
            const token = await auth.currentUser.getIdToken();
            await fetch(`${getApiBase()}/api/emails/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    to: assignment.buyer_email,
                    subject: "Your Delivery Verification Code - OmniShop",
                    html: `
                        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                            <h2 style="color: #fb923c; text-align: center;">Order Out for Delivery!</h2>
                            <p>Hi <b>${assignment.buyer_name}</b>,</p>
                            <p>Your order <b>#${assignment.order_id.slice(0,8).toUpperCase()}</b> is being delivered by our executive.</p>
                            <div style="background: #fff7ed; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 14px; color: #666;">Share this Delivery OTP with the delivery boy:</p>
                                <p style="margin: 5px 0 0 0; font-size: 32px; font-weight: bold; color: #ea580c; letter-spacing: 5px;">${otp}</p>
                            </div>
                            <p style="font-size: 12px; color: #999; text-align: center;">Please do not share this code with anyone else until you receive your package.</p>
                        </div>
                    `
                })
            });
            toast.success("OTP sent to customer's email!");
        } catch (err) {
            console.error("OTP email error:", err);
            toast.error("Failed to send OTP email.");
        }
    };

    const resendOtp = async (assignment) => {
        const otp = assignment.otp || Math.floor(1000 + Math.random() * 9000).toString();
        if (!assignment.otp) {
            await updateDeliveryAssignment(assignment.id, { otp });
        }
        await sendDeliveryOtpEmail(assignment, otp);
    };

    const active = assignments.filter(a => !["delivered", "failed"].includes(a.status));
    const completed = assignments.filter(a => ["delivered", "failed"].includes(a.status));
    const displayed = tab === "active" ? active : completed;
    const groupedByDate = displayed.reduce((acc, item) => {
        const key = item.estimated_delivery_date_key
            || (item.estimated_delivery_date ? String(item.estimated_delivery_date).slice(0, 10) : "unscheduled");
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});
    const dateKeys = Object.keys(groupedByDate).sort();

    const todayEarnings = completed
        .filter(a => {
            if (a.status !== "delivered" || !a.cod_collected) return false;
            const date = a.created_date?.toDate ? a.created_date.toDate() : new Date(a.created_date || 0);
            return date.toDateString() === new Date().toDateString();
        })
        .reduce((s, a) => s + (Number(a.total_amount) || 0), 0);

    if (loading) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-orange-400" /></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Navigation className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Delivery Dashboard</h1>
                        <p className="text-muted-foreground text-sm">Welcome, {user.full_name || user.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-card border border-border rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-orange-500">{active.length}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">{completed.filter(a => a.status === "delivered").length}</p>
                        <p className="text-xs text-muted-foreground">Delivered</p>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">₹{todayEarnings.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">COD Today</p>
                    </div>
                </div>

                <div className="flex gap-2 mb-4 border-b border-border">
                    {["active", "history"].map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-all ${tab === t ? "border-orange-400 text-orange-600" : "border-transparent text-muted-foreground"}`}>
                            {t} {t === "active" ? `(${active.length})` : `(${completed.length})`}
                        </button>
                    ))}
                </div>

                {displayed.length === 0 ? (
                    <div className="text-center py-16">
                        <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                        <p className="font-semibold">No {tab === "active" ? "active deliveries" : "history"}</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {dateKeys.map((dateKey) => (
                            <div key={dateKey}>
                                <h3 className="text-sm font-bold text-muted-foreground mb-2">
                                    {dateKey === "unscheduled" ? "Unscheduled" : `Delivery Date: ${new Date(`${dateKey}T12:00:00Z`).toLocaleDateString()}`}
                                </h3>
                                <div className="space-y-4">
                                    {groupedByDate[dateKey].map(a => (
                                        <div key={a.id} className="bg-card border border-border rounded-xl p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-bold text-sm">Order #{a.order_id?.slice(0, 10).toUpperCase()}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {a.created_date?.seconds 
                                                ? new Date(a.created_date.seconds * 1000).toLocaleString() 
                                                : new Date(a.created_date || Date.now()).toLocaleString()}
                                        </p>
                                    </div>
                                    <Badge className={`${STATUS_COLOR[a.status]} border-0 text-xs capitalize`}>
                                        {STATUS_LABEL[a.status]}
                                    </Badge>
                                </div>

                                <div className="bg-muted rounded-lg p-3 mb-3 space-y-1">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{a.buyer_name}</span>
                                    </div>
                                    {a.buyer_phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <a href={`tel:${a.buyer_phone}`} className="text-blue-600 font-medium">{a.buyer_phone}</a>
                                        </div>
                                    )}
                                    <div className="flex items-start gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <span>{a.delivery_address}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mb-3 text-sm">
                                    <span className="text-muted-foreground">{a.items_summary}</span>
                                    <div className="flex items-center gap-1 font-bold">
                                        <IndianRupee className="h-3.5 w-3.5" />
                                        {a.total_amount?.toLocaleString()}
                                        {a.payment_method === "COD" && (
                                            <span className="text-xs text-orange-600 font-normal ml-1">(Collect Cash)</span>
                                        )}
                                    </div>
                                </div>

                                {a.status === "out_for_delivery" && (
                                    <div className="mb-3 border-t border-dashed pt-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Delivery Verification</label>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => resendOtp(a)} 
                                                className="h-7 text-[10px] border-orange-200 text-orange-600 hover:bg-orange-50 px-2"
                                            >
                                                Resend OTP to Customer
                                            </Button>
                                        </div>
                                        <input
                                            value={otpInputs[a.id] || ""}
                                            onChange={e => setOtpInputs(prev => ({ ...prev, [a.id]: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                                            placeholder="Enter 4-digit OTP from customer"
                                            className="w-full border border-border rounded-lg px-3 py-3 text-center tracking-[0.5em] text-2xl font-black focus:ring-2 focus:ring-orange-400 outline-none transition-all shadow-inner bg-gray-50"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-2 text-center italic">Ask the customer for the code sent to their email to confirm delivery</p>
                                    </div>
                                )}

                                {!["delivered", "failed"].includes(a.status) && (
                                    <div className="mb-3">
                                        <div className="flex justify-between mb-1">
                                            {STATUS_FLOW.map((s, i) => (
                                                <span key={s} className={`text-[10px] ${STATUS_FLOW.indexOf(a.status) >= i ? "text-orange-500 font-bold" : "text-muted-foreground"}`}>
                                                    {STATUS_LABEL[s].split(" ")[0]}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-1">
                                            {STATUS_FLOW.map((s, i) => (
                                                <div key={s} className={`flex-1 h-1.5 rounded-full ${STATUS_FLOW.indexOf(a.status) >= i ? "bg-orange-400" : "bg-muted"}`} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!["delivered", "failed"].includes(a.status) && (
                                    <div className="flex gap-2">
                                        <Button onClick={() => advanceStatus(a)} disabled={updating === a.id}
                                            className="flex-1 bg-orange-400 hover:bg-orange-500 text-white text-sm font-bold shadow-md shadow-orange-100">
                                            {updating === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                                a.status === "assigned" ? "Mark Picked Up" :
                                                    a.status === "picked_up" ? "Out for Delivery" :
                                                        "Confirm Delivery ✓"
                                            )}
                                        </Button>
                                        <Button onClick={() => markFailed(a)} disabled={updating === a.id} variant="outline" className="text-red-500 border-red-100 text-xs px-3 hover:bg-red-50">
                                            Failed
                                        </Button>
                                    </div>
                                )}

                                {a.status === "delivered" && (
                                    <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 p-2 rounded-lg justify-center">
                                        <CheckCircle className="h-4 w-4" /> Delivered {a.cod_collected ? "· COD Collected" : ""}
                                    </div>
                                )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
