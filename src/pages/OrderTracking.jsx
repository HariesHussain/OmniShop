import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getOrder, getDeliveryAssignmentsByOrder } from "@/services/firestoreService";
import Navbar from "@/components/Navbar";
import { Loader2, Clock, MapPin, Phone, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const STEPS = [
    { key: "confirmed", label: "Order Confirmed", icon: "✅", desc: "Your order has been placed and confirmed" },
    { key: "shipped", label: "Shipped", icon: "📦", desc: "Your order is on its way" },
    { key: "out_for_delivery", label: "Out for Delivery", icon: "🚚", desc: "Delivery partner is heading to you" },
    { key: "delivered", label: "Delivered", icon: "🎉", desc: "Your order has been delivered!" },
];

const STATUS_IDX = { confirmed: 0, shipped: 1, out_for_delivery: 2, delivered: 3 };

export default function OrderTracking() {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get("id");
    const [order, setOrder] = useState(null);
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [otp, setOtp] = useState(null);

    useEffect(() => {
        if (orderId) loadOrder();
    }, [orderId]);

    const loadOrder = async () => {
        setLoading(true);
        try {
            const o = await getOrder(orderId);
            setOrder(o);
            // Look for delivery assignment
            const assigns = await getDeliveryAssignmentsByOrder(orderId);
            if (assigns.length > 0) {
                setAssignment(assigns[0]);
                // Show OTP for COD delivery
                if (assigns[0].otp && assigns[0].payment_method === "COD" && assigns[0].status === "out_for_delivery") {
                    setOtp(assigns[0].otp);
                }
            }
        } catch (error) {
            console.error("Failed to load order:", error);
            toast.error("Failed to load order details");
        }
        setLoading(false);
    };

    const copyOtp = () => {
        navigator.clipboard.writeText(otp);
        toast.success("OTP copied!");
    };

    if (loading) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-orange-400" /></div>
        </div>
    );

    if (!order) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="text-center py-32">
                <p className="text-xl">Order not found</p>
                <Link to="/orders" className="text-orange-500 hover:underline mt-2 block">View My Orders</Link>
            </div>
        </div>
    );

    const currentStep = STATUS_IDX[assignment?.status] ?? STATUS_IDX[order.status] ?? 0;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold">Order Tracking</h1>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">#{order.id?.slice(0, 16).toUpperCase()}</p>
                    </div>
                    <Badge className={`border-0 capitalize text-sm ${order.status === "delivered" ? "bg-green-100 text-green-700" :
                            order.status === "cancelled" ? "bg-red-100 text-red-700" :
                                "bg-blue-100 text-blue-700"
                        }`}>{order.status}</Badge>
                </div>

                {/* OTP Box for COD */}
                {otp && (
                    <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 mb-6 text-center">
                        <p className="text-sm font-semibold text-orange-700 mb-1">📱 Your Delivery OTP</p>
                        <p className="text-xs text-orange-600 mb-2">Share this with the delivery person to confirm receipt</p>
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-4xl font-bold tracking-widest text-orange-600">{otp}</span>
                            <button onClick={copyOtp} className="text-orange-500">
                                <Copy className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Tracking Timeline */}
                <div className="bg-card border border-border rounded-xl p-5 mb-4">
                    <h2 className="font-bold mb-4">Delivery Status</h2>
                    <div className="space-y-4">
                        {STEPS.map((step, i) => {
                            const done = i <= currentStep;
                            const current = i === currentStep;
                            return (
                                <div key={step.key} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg border-2 transition-all ${done ? "border-orange-400 bg-orange-50" : "border-muted bg-muted/30"
                                            } ${current ? "ring-4 ring-orange-100" : ""}`}>
                                            {done ? step.icon : <span className="w-3 h-3 bg-muted-foreground/30 rounded-full" />}
                                        </div>
                                        {i < STEPS.length - 1 && (
                                            <div className={`w-0.5 h-8 mt-1 ${done ? "bg-orange-300" : "bg-muted"}`} />
                                        )}
                                    </div>
                                    <div className="flex-1 pb-2">
                                        <p className={`font-semibold text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                                        <p className={`text-xs mt-0.5 ${done ? "text-muted-foreground" : "text-muted-foreground/50"}`}>{step.desc}</p>
                                        {current && <p className="text-xs text-orange-500 font-medium mt-0.5 flex items-center gap-1"><Clock className="h-3 w-3" /> In progress</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Delivery Agent Info */}
                {assignment && assignment.status !== "failed" && (
                    <div className="bg-card border border-border rounded-xl p-4 mb-4">
                        <h3 className="font-bold mb-2 text-sm">Delivery Partner</h3>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600">
                                {assignment.delivery_boy_name?.charAt(0)?.toUpperCase() || "D"}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm">{assignment.delivery_boy_name || "OmniShop Delivery"}</p>
                                <p className="text-xs text-muted-foreground capitalize">{STATUS_LABEL?.[assignment.status] || assignment.status}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Order Items */}
                <div className="bg-card border border-border rounded-xl p-4 mb-4">
                    <h3 className="font-bold mb-3 text-sm">Order Items</h3>
                    <div className="space-y-2">
                        {order.items?.map((item, i) => (
                            <div key={i} className="flex gap-3 items-center">
                                <img src={item.image || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=80"} alt=""
                                    className="w-12 h-12 object-contain rounded bg-gray-50 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.title}</p>
                                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
                                </div>
                                <p className="font-semibold text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-border mt-3 pt-3 flex justify-between text-sm">
                        <span className="font-bold">Total</span>
                        <span className="font-bold">₹{order.total_amount?.toLocaleString()}</span>
                    </div>
                </div>

                {/* Shipping Address */}
                {order.shipping_address && (
                    <div className="bg-card border border-border rounded-xl p-4">
                        <h3 className="font-bold mb-2 text-sm flex items-center gap-1"><MapPin className="h-4 w-4" /> Delivery Address</h3>
                        <p className="text-sm font-medium">{order.shipping_address.name}</p>
                        <p className="text-sm text-muted-foreground">{order.shipping_address.address}</p>
                        <p className="text-sm text-muted-foreground">{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}</p>
                        {order.shipping_address.phone && (
                            <p className="text-sm text-blue-600 mt-1 flex items-center gap-1"><Phone className="h-3 w-3" />{order.shipping_address.phone}</p>
                        )}
                    </div>
                )}

                <div className="mt-4 text-center">
                    <Link to="/orders" className="text-orange-500 hover:underline text-sm">← Back to My Orders</Link>
                </div>
            </div>
        </div>
    );
}

const STATUS_LABEL = {
    assigned: "Assigned",
    picked_up: "Picked Up",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    failed: "Delivery Failed",
};