import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getOrders, updateOrder, getProduct, updateProduct } from "@/services/firestoreService";
import Navbar from "@/components/Navbar";
import { Loader2, Package, XCircle, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STATUS_COLORS = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700"
};

const STATUS_STEPS = ["confirmed", "shipped", "delivered"];

export default function Orders() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(null);

    useEffect(() => {
        if (!user) { navigate("/sign-in"); return; }
        loadOrders();
    }, [user]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await getOrders(user.email);
            setOrders(data);
        } catch (error) {
            console.error("Failed to load orders:", error);
            toast.error("Failed to load orders");
        }
        setLoading(false);
    };

    const cancelOrder = async (order) => {
        if (!["pending", "confirmed"].includes(order.status)) {
            toast.error("Cannot cancel order that is already shipped or delivered");
            return;
        }
        setCancelling(order.id);
        try {
            await updateOrder(order.id, { status: "cancelled", payment_status: order.payment_status === "paid" ? "refunded" : "pending" });
            // Restore stock
            for (const item of order.items || []) {
                try {
                    const prod = await getProduct(item.product_id);
                    if (prod) await updateProduct(item.product_id, { stock: (prod.stock || 0) + item.quantity });
                } catch (e) { }
            }
            toast.success("Order cancelled" + (order.payment_status === "paid" ? " — refund will be processed in 5-7 days" : ""));
            loadOrders();
        } catch (error) {
            console.error("Failed to cancel order:", error);
            toast.error("Failed to cancel order");
        }
        setCancelling(null);
    };

    if (loading) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-orange-400" /></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold mb-6">My Orders</h1>
                {orders.length === 0 ? (
                    <div className="text-center py-24">
                        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-xl font-semibold mb-2">No orders yet</p>
                        <Link to="/" className="text-orange-500 hover:underline">Start shopping</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order.id} className="bg-card border border-border rounded-xl p-5">
                                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Order ID</p>
                                        <p className="font-mono text-sm font-medium">{order.id.slice(0, 12).toUpperCase()}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.created_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <Badge className={`${STATUS_COLORS[order.status]} border-0 capitalize`}>{order.status}</Badge>
                                        {order.delivery_estimate && order.status !== "delivered" && order.status !== "cancelled" && (
                                            <p className="text-[10px] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded border border-green-100">
                                                Arriving by {new Date(order.delivery_estimate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
                                            </p>
                                        )}
                                        {order.payment_status === "refunded" && <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">Refund Processing</Badge>}
                                    </div>
                                </div>

                                {/* Progress bar */}
                                {!["cancelled"].includes(order.status) && (
                                    <div className="mb-4">
                                        <div className="flex justify-between mb-1">
                                            {STATUS_STEPS.map((s, i) => (
                                                <span key={s} className={`text-xs capitalize font-medium ${STATUS_STEPS.indexOf(order.status) >= i ? "text-orange-500" : "text-muted-foreground"}`}>{s}</span>
                                            ))}
                                        </div>
                                        <div className="flex gap-1">
                                            {STATUS_STEPS.map((s, i) => (
                                                <div key={s} className={`flex-1 h-1.5 rounded-full ${STATUS_STEPS.indexOf(order.status) >= i ? "bg-orange-400" : "bg-muted"}`} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 mb-3">
                                    {order.items?.map((item, i) => (
                                        <div key={i} className="flex gap-3 items-center">
                                            <Link to={`/product/${item.product_id}`} className="flex-shrink-0 hover:opacity-80 transition-opacity">
                                                <img src={item.image || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=80"} alt="" className="w-12 h-12 object-contain rounded bg-gray-50" />
                                            </Link>
                                            <div className="flex-1 min-w-0">
                                                <Link to={`/product/${item.product_id}`} className="text-sm font-medium truncate hover:text-orange-500 transition-colors block">
                                                    {item.title}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
                                            </div>
                                            <p className="font-medium text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-border pt-3 flex items-center justify-between flex-wrap gap-2">
                                    <div className="text-sm text-muted-foreground">
                                        <span>{order.payment_method}</span>
                                        <span className="mx-2">·</span>
                                        <span className={order.payment_status === "paid" ? "text-green-600 font-medium" : order.payment_status === "refunded" ? "text-orange-500 font-medium" : ""}>
                                            {order.payment_status}
                                        </span>
                                        {order.shipping_address && <span className="mx-2">· {order.shipping_address.city}</span>}
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <Link to={`/order-tracking?id=${order.id}`} className="text-orange-500 hover:underline text-sm flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> Track
                                        </Link>
                                        {["pending", "confirmed"].includes(order.status) && (
                                            <Button variant="outline" size="sm" onClick={() => cancelOrder(order)} disabled={cancelling === order.id}
                                                className="text-red-500 border-red-200 hover:bg-red-50 gap-1">
                                                {cancelling === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}