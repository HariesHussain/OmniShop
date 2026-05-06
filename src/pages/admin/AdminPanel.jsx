import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/firebase/firebaseConfig";
import { listProducts, deleteProduct as deleteProductFn, updateProduct, listOrders, updateOrder, listUsers, updateUserProfile, listSellerApps, updateSellerApp, listDeliveryApps, updateDeliveryApp, listDeliveryAssignments, createDeliveryAssignment, createNotification, getUserByEmail } from "@/services/firestoreService";
import Navbar from "@/components/Navbar";
import { getApiBase } from "@/lib/apiConfig";
import { toast } from "sonner";
import { Users, Package, ShoppingBag, DollarSign, Loader2, Trash2, CheckCircle, XCircle, TrendingUp, Store, Bell, Truck, Settings, Search, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STATUS_COLORS = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700"
};
const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const CATEGORIES = ["Electronics", "Clothing", "Books", "Home & Kitchen", "Sports", "Beauty", "Toys", "Automotive", "Grocery", "Other"];
const emptyForm = { title: "", description: "", price: "", original_price: "", category: "Electronics", brand: "", images: [""], stock: "", tags: "", is_active: true };

export default function AdminPanel() {
    const { user, isLoadingAuth } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState("overview");
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [sellerApps, setSellerApps] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [deliveryApps, setDeliveryApps] = useState([]);
    const [notifForm, setNotifForm] = useState({ title: "", message: "", type: "offer" });
    const [sendingNotif, setSendingNotif] = useState(false);
    const [loading, setLoading] = useState(true);
    const [upiId, setUpiId] = useState("");
    const [savingSettings, setSavingSettings] = useState(false);
    const [assigning, setAssigning] = useState(null);
    const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState({});
    const [searchUser, setSearchUser] = useState("");
    const [showProductForm, setShowProductForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [productForm, setProductForm] = useState(emptyForm);
    const [savingProduct, setSavingProduct] = useState(false);

    const deliveryBoys = allUsers.filter(u => u.role === "delivery_boy");
    const TABS = ["overview", "orders", "delivery", "products", "users", "sellers", "analytics", "notifications", "settings"];

    useEffect(() => {
        if (isLoadingAuth) return;
        if (!user) { navigate("/sign-in"); return; }
        if (user.role !== "admin") { 
            navigate("/"); 
            toast.error("Admin access only"); 
            return; 
        }
        loadData();
        loadUpi();
    }, [user, isLoadingAuth]);

    const loadUpi = async () => {
        // UPI ID is stored in user profile - already loaded from useAuth
        setUpiId(user?.upi_id || "");
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [prods, ords, usrs, apps, delivs, dapps] = await Promise.all([
                listProducts(),
                listOrders(),
                listUsers(),
                listSellerApps(),
                listDeliveryAssignments(),
                listDeliveryApps(),
            ]);
            setProducts(prods);
            setOrders(ords);
            setAllUsers(usrs);
            setSellerApps(apps);
            setDeliveries(delivs);
            setDeliveryApps(dapps);
        } catch (error) {
            console.error("Failed to load admin data:", error);
            toast.error("Failed to load data");
        }
        setLoading(false);
    };

    const updateDeliveryAppStatus = async (id, status, applicantEmail) => {
        try {
            await updateDeliveryApp(id, { status, updated_at: new Date() });
            if (status === "approved" && applicantEmail) {
                // Find user with case-insensitive search
                let targetUser = allUsers.find(u => u.email?.toLowerCase() === applicantEmail.toLowerCase());
                
                // Fallback: If not in cached allUsers, fetch from DB
                if (!targetUser) {
                    targetUser = await getUserByEmail(applicantEmail);
                }

                if (targetUser) {
                    await updateUserProfile(targetUser.uid || targetUser.id, { role: "delivery_boy" });
                    
                    const sApps = await listSellerApps();
                    const pendingSellerApp = sApps.find(a => a.applicant_email?.toLowerCase() === applicantEmail.toLowerCase() && a.status === 'pending');
                    if (pendingSellerApp) {
                        await updateSellerApp(pendingSellerApp.id, { status: 'rejected', admin_note: 'User approved as Delivery Partner.' });
                    }
                    toast.success("User role updated to Delivery Partner");
                } else {
                    console.warn("User profile not found for email:", applicantEmail);
                    toast.error("Application approved, but user profile was not found to update role.");
                }
            }
            toast.success(`Delivery application ${status}`);
            loadData();
        } catch (error) {
            console.error("Failed to update delivery app:", error);
            toast.error("Failed to update application");
        }
    };

    const updateSellerAppStatus = async (id, status, applicantEmail) => {
        try {
            await updateSellerApp(id, { status, updated_at: new Date(), admin_note: status === "rejected" ? "Does not meet requirements" : "" });
            if (status === "approved" && applicantEmail) {
                // Find user with case-insensitive search
                let targetUser = allUsers.find(u => u.email?.toLowerCase() === applicantEmail.toLowerCase());
                
                // Fallback: If not in cached allUsers, fetch from DB
                if (!targetUser) {
                    targetUser = await getUserByEmail(applicantEmail);
                }

                if (targetUser) {
                    await updateUserProfile(targetUser.uid || targetUser.id, { role: "seller" });
                    
                    const dApps = await listDeliveryApps();
                    const pendingDeliveryApp = dApps.find(a => a.applicant_email?.toLowerCase() === applicantEmail.toLowerCase() && a.status === 'pending');
                    if (pendingDeliveryApp) {
                        await updateDeliveryApp(pendingDeliveryApp.id, { status: 'rejected', admin_note: 'User approved as Seller.' });
                    }
                    toast.success("User role updated to Seller");
                } else {
                    console.warn("User profile not found for email:", applicantEmail);
                    toast.error("Application approved, but user profile was not found to update role.");
                }
            }
            toast.success(`Application ${status}`);
            loadData();
        } catch (error) {
            console.error("Failed to update seller app:", error);
            toast.error("Failed to update application");
        }
    };

    const updateUserRole = async (userId, role) => {
        try {
            await updateUserProfile(userId, { role });
            toast.success(`Role updated to ${role}`);
            loadData();
        } catch (error) {
            console.error("Failed to update user role:", error);
            toast.error("Failed to update role");
        }
    };

    const sendNotification = async () => {
        if (!notifForm.title || !notifForm.message) { toast.error("Fill title and message"); return; }
        setSendingNotif(true);
        try {
            await createNotification({ ...notifForm, is_broadcast: true, is_read: false });
            toast.success("Notification sent to all users!");
            setNotifForm({ title: "", message: "", type: "offer" });
        } catch (error) {
            console.error("Failed to send notification:", error);
            toast.error("Failed to send notification");
        }
        setSendingNotif(false);
    };

    const deleteProduct = async (id) => {
        try {
            await deleteProductFn(id);
            toast.success("Product deleted");
            loadData();
        } catch (error) {
            console.error("Failed to delete product:", error);
            toast.error("Failed to delete product");
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            await updateOrder(orderId, { status });
            const token = await auth.currentUser.getIdToken();
            await fetch(`${getApiBase()}/api/orders/${orderId}/status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });
            loadData();
        } catch (error) {
            console.error("Failed to update order status:", error);
            toast.error("Failed to update order");
        }
    };

    const toggleProductActive = async (p) => {
        try {
            await updateProduct(p.id, { is_active: !p.is_active });
            loadData();
        } catch (error) {
            console.error("Failed to toggle product:", error);
            toast.error("Failed to update product");
        }
    };

    const saveUpiSettings = async () => {
        setSavingSettings(true);
        try {
            await updateUserProfile(user.uid, { upi_id: upiId });
            toast.success("Payment settings saved!");
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error("Failed to save settings");
        }
        setSavingSettings(false);
    };

    // Auto-assign: pick delivery boy with fewest active assignments
    const getAutoDeliveryBoy = () => {
        if (deliveryBoys.length === 0) return null;
        const counts = {};
        deliveryBoys.forEach(db => { counts[db.email] = 0; });
        deliveries.filter(d => !['delivered', 'failed'].includes(d.status)).forEach(d => {
            if (counts[d.delivery_boy_email] !== undefined) counts[d.delivery_boy_email]++;
        });
        return deliveryBoys.reduce((min, db) => counts[db.email] < counts[min.email] ? db : min, deliveryBoys[0]);
    };

    const assignDelivery = async (order) => {
        const dbEmail = selectedDeliveryBoy[order.id] || getAutoDeliveryBoy()?.email;
        if (!dbEmail) { toast.error("No delivery partners available. Approve delivery applications first."); return; }
        const db = deliveryBoys.find(u => u.email === dbEmail);
        setAssigning(order.id);
        try {
            const otp = String(Math.floor(1000 + Math.random() * 9000));
            const addrObj = order.shipping_address || {};
            await createDeliveryAssignment({
                order_id: order.id,
                delivery_boy_email: dbEmail,
                delivery_boy_name: db?.full_name || dbEmail,
                buyer_name: order.buyer_name,
                buyer_phone: addrObj.phone || "",
                buyer_email: order.buyer_email,
                delivery_address: `${addrObj.address || ""}, ${addrObj.city || ""}, ${addrObj.state || ""} - ${addrObj.pincode || ""}`,
                items_summary: order.items?.map(i => `${i.title} x${i.quantity}`).join(", ") || "",
                total_amount: order.total_amount,
                payment_method: order.payment_method,
                status: "assigned",
                cod_collected: false,
                otp,
            });
            await updateOrder(order.id, { status: "shipped" });
            const token = await auth.currentUser.getIdToken();
            await fetch(`${getApiBase()}/api/orders/${order.id}/delivery-assigned`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            await createNotification({
                user_email: order.buyer_email,
                title: "🚚 Order Dispatched!",
                message: `Your order is on the way! Delivery OTP: ${otp} (share with delivery partner for COD orders).`,
                type: "order",
                is_read: false,
            });
            toast.success("Delivery assigned and buyer notified!");
            loadData();
        } catch (error) {
            console.error("Failed to assign delivery:", error);
            toast.error("Failed to assign delivery");
        }
        setAssigning(null);
    };

    const openEdit = (p) => {
        setProductForm({ ...p, price: String(p.price || ""), original_price: String(p.original_price || ""), stock: String(p.stock || ""), images: p.images?.length ? p.images : [""], tags: Array.isArray(p.tags) ? p.tags.join(", ") : "" });
        setEditId(p.id); setShowProductForm(true);
    };

    const saveProduct = async () => {
        if (!productForm.title || !productForm.price || !productForm.category) { toast.error("Fill required fields"); return; }
        setSavingProduct(true);
        try {
            const data = {
                title: productForm.title, description: productForm.description || "", price: Number(productForm.price) || 0,
                original_price: productForm.original_price ? Number(productForm.original_price) : undefined,
                category: productForm.category, brand: productForm.brand || "",
                images: Array.isArray(productForm.images) ? productForm.images.filter(Boolean) : [], 
                stock: Number(productForm.stock) || 0,
                is_active: productForm.is_active, is_featured: productForm.is_featured || false,
                tags: productForm.tags ? (typeof productForm.tags === 'string' ? productForm.tags.split(",").map(t => t.trim()).filter(Boolean) : productForm.tags) : []
            };
            if (editId) await updateProduct(editId, data);
            toast.success("Product updated!");
            setShowProductForm(false); loadData();
        } catch (error) {
            console.error("Failed to save product:", error);
            toast.error("Failed to update product");
        }
        setSavingProduct(false);
    };

    const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.total_amount || 0), 0);
    const pendingRevenue = orders.filter(o => ["confirmed", "shipped"].includes(o.status)).reduce((s, o) => s + (o.total_amount || 0), 0);

    const stats = [
        { label: "Products", value: products.length, icon: Package, color: "text-blue-500", bg: "bg-blue-50" },
        { label: "Orders", value: orders.length, icon: ShoppingBag, color: "text-orange-500", bg: "bg-orange-50" },
        { label: "Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-500", bg: "bg-green-50" },
        { label: "Pipeline", value: `₹${pendingRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-yellow-500", bg: "bg-yellow-50" },
        { label: "Users", value: allUsers.length, icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
        { label: "Deliveries", value: deliveries.filter(d => !["delivered", "failed"].includes(d.status)).length, icon: Truck, color: "text-teal-500", bg: "bg-teal-50" },
    ];

    const filteredUsers = allUsers.filter(u =>
        !searchUser || u.email?.toLowerCase().includes(searchUser.toLowerCase()) || u.full_name?.toLowerCase().includes(searchUser.toLowerCase())
    );

    const unassignedOrders = orders.filter(o =>
        o.status === "confirmed"
        && (!o.assignedDeliveryBoyId || o.deliveryStatus === "pending_assignment")
        && !deliveries.find(d => d.order_id === o.id)
    );

    if (loading) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-orange-400" /></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold mb-1">Admin Panel</h1>
                <p className="text-muted-foreground text-sm mb-4">Full platform management</p>

                <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto scrollbar-none">
                    {TABS.map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-3 py-2 text-xs sm:text-sm font-medium capitalize transition-all border-b-2 -mb-px whitespace-nowrap ${tab === t ? "border-orange-400 text-orange-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                            {t}{t === "delivery" && unassignedOrders.length > 0 ? ` (${unassignedOrders.length})` : ""}
                        </button>
                    ))}
                </div>

                {/* OVERVIEW */}
                {tab === "overview" && (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
                            {stats.map(s => {
                                const Icon = s.icon;
                                return (
                                    <div key={s.label} className="bg-card border border-border rounded-xl p-3">
                                        <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-2`}><Icon className={`h-4 w-4 ${s.color}`} /></div>
                                        <p className="text-xl font-bold">{s.value}</p>
                                        <p className="text-xs text-muted-foreground">{s.label}</p>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div className="bg-card border border-border rounded-xl p-4">
                                <h3 className="font-bold mb-3 text-sm">Recent Orders</h3>
                                {orders.slice(0, 6).map(o => (
                                    <div key={o.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
                                        <span className="font-mono">{o.id.slice(0, 8).toUpperCase()}</span>
                                        <span className="text-muted-foreground truncate max-w-20">{o.buyer_name}</span>
                                        <span className="font-medium">₹{o.total_amount?.toLocaleString()}</span>
                                        <Badge className={`${STATUS_COLORS[o.status]} border-0 text-xs capitalize`}>{o.status}</Badge>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-card border border-border rounded-xl p-4">
                                <h3 className="font-bold mb-3 text-sm">Category Breakdown</h3>
                                {Object.entries(products.reduce((acc, p) => ({ ...acc, [p.category]: (acc[p.category] || 0) + 1 }), {}))
                                    .sort((a, b) => b[1] - a[1]).slice(0, 7).map(([cat, count]) => (
                                        <div key={cat} className="flex items-center gap-2 py-1">
                                            <span className="text-xs flex-1">{cat}</span>
                                            <div className="flex-1 bg-muted rounded-full h-1.5">
                                                <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${(count / products.length) * 100}%` }} />
                                            </div>
                                            <span className="text-xs font-medium w-6 text-right">{count}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </>
                )}

                {/* ORDERS */}
                {tab === "orders" && (
                    <div className="bg-card border border-border rounded-xl overflow-auto">
                        <table className="w-full text-xs min-w-[800px]">
                            <thead className="bg-muted">
                                <tr>{["Order ID", "Buyer", "Total", "Payment", "Pay Status", "Status", "Date", "Update"].map(h => <th key={h} className="text-left px-3 py-2.5 font-semibold text-muted-foreground">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {orders.map(o => (
                                    <tr key={o.id} className="hover:bg-muted/30">
                                        <td className="px-3 py-2 font-mono">{o.id.slice(0, 10).toUpperCase()}</td>
                                        <td className="px-3 py-2 truncate max-w-24">{o.buyer_name}</td>
                                        <td className="px-3 py-2 font-medium">₹{o.total_amount?.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-muted-foreground">{o.payment_method}</td>
                                        <td className="px-3 py-2"><Badge className={`border-0 text-xs capitalize ${o.payment_status === "paid" ? "bg-green-100 text-green-700" : o.payment_status === "refunded" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>{o.payment_status || "pending"}</Badge></td>
                                        <td className="px-3 py-2"><Badge className={`${STATUS_COLORS[o.status]} border-0 text-xs capitalize`}>{o.status}</Badge></td>
                                        <td className="px-3 py-2 text-muted-foreground">{new Date(o.created_date).toLocaleDateString()}</td>
                                        <td className="px-3 py-2">
                                            <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)} className="border border-border rounded px-1.5 py-1 text-xs bg-background">
                                                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PRODUCTS */}
                {tab === "products" && (
                    <div className="bg-card border border-border rounded-xl overflow-auto">
                        <table className="w-full text-xs min-w-[700px]">
                            <thead className="bg-muted"><tr>{["Product", "Category", "Price", "Stock", "Seller", "Status", "Actions"].map(h => <th key={h} className="text-left px-3 py-2.5 font-semibold text-muted-foreground">{h}</th>)}</tr></thead>
                            <tbody className="divide-y divide-border">
                                {products.map(p => (
                                    <tr key={p.id} className="hover:bg-muted/30">
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <img src={p.images?.[0]} alt="" className="w-8 h-8 object-contain rounded bg-gray-50" onError={e => { e.target.src = "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=60"; }} />
                                                <span className="line-clamp-1 max-w-28">{p.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-muted-foreground">{p.category}</td>
                                        <td className="px-3 py-2 font-medium">₹{p.price?.toLocaleString()}</td>
                                        <td className="px-3 py-2">{p.stock || 0}</td>
                                        <td className="px-3 py-2 text-muted-foreground truncate max-w-24">{p.seller_email}</td>
                                        <td className="px-3 py-2"><Badge className={`border-0 text-xs ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{p.is_active ? "Active" : "Inactive"}</Badge></td>
                                        <td className="px-3 py-2">
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="ghost" onClick={() => openEdit(p)} className="h-7 w-7 p-0">
                                                    <Edit className="h-4 w-4 text-blue-500" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => toggleProductActive(p)} className="h-7 w-7 p-0">
                                                    {p.is_active ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => deleteProduct(p.id)} className="h-7 w-7 p-0">
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* USERS */}
                {tab === "users" && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Search users..." className="pl-9" />
                            </div>
                            <p className="text-sm text-muted-foreground">{filteredUsers.length} users</p>
                        </div>
                        <div className="bg-card border border-border rounded-xl overflow-auto">
                            <table className="w-full text-xs min-w-[600px]">
                                <thead className="bg-muted"><tr>{["Name", "Email", "Role", "Joined", "Change Role"].map(h => <th key={h} className="text-left px-3 py-2.5 font-semibold text-muted-foreground">{h}</th>)}</tr></thead>
                                <tbody className="divide-y divide-border">
                                    {filteredUsers.map(u => (
                                        <tr key={u.uid || u.id} className="hover:bg-muted/30">
                                            <td className="px-3 py-2 font-medium">{u.full_name || "—"}</td>
                                            <td className="px-3 py-2 text-muted-foreground truncate max-w-40">{u.email}</td>
                                            <td className="px-3 py-2">
                                                <Badge className={`border-0 text-xs capitalize ${u.role === "admin" ? "bg-red-100 text-red-700" : u.role === "seller" ? "bg-purple-100 text-purple-700" : u.role === "delivery_boy" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{u.role || "user"}</Badge>
                                            </td>
                                            <td className="px-3 py-2 text-muted-foreground">{new Date(u.created_date || u.createdAt?.toDate?.() || u.createdAt).toLocaleDateString()}</td>
                                            <td className="px-3 py-2">
                                                <select value={u.role || "user"} onChange={e => updateUserRole(u.uid || u.id, e.target.value)} className="border border-border rounded px-2 py-1 text-xs bg-background">
                                                    {["user", "seller", "delivery_boy", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SELLERS */}
                {/* DELIVERY APPLICATIONS */}
                {tab === "delivery" && (
                    <div className="space-y-6">
                        {deliveryApps.filter(a => a.status === "pending").length > 0 && (
                            <div>
                                <h2 className="font-bold mb-3">Pending Delivery Partner Applications ({deliveryApps.filter(a => a.status === "pending").length})</h2>
                                {deliveryApps.filter(a => a.status === "pending").map(app => (
                                    <div key={app.id} className="bg-card border border-border rounded-xl p-4 mb-3">
                                        <div className="flex items-start justify-between flex-wrap gap-3">
                                            <div>
                                                <p className="font-bold">{app.applicant_name}</p>
                                                <p className="text-sm text-muted-foreground">{app.applicant_email} · {app.phone}</p>
                                                <p className="text-xs mt-1">{app.vehicle_type} · Area: {app.area} · {app.experience}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={() => updateDeliveryAppStatus(app.id, "approved", app.applicant_email)} className="bg-green-500 hover:bg-green-600 text-white text-xs h-7">
                                                    <CheckCircle className="h-3 w-3 mr-1" /> Approve
                                                </Button>
                                                <Button size="sm" onClick={() => updateDeliveryAppStatus(app.id, "rejected", app.applicant_email)} className="bg-red-500 hover:bg-red-600 text-white text-xs h-7">
                                                    <XCircle className="h-3 w-3 mr-1" /> Reject
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div>
                            <h2 className="font-bold mb-2">Assign Deliveries <span className="text-sm text-muted-foreground font-normal">(Auto-balanced across partners)</span></h2>
                            {deliveryBoys.length === 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-3 text-sm text-yellow-700">
                                    No delivery partners yet. Approve delivery applications above, or go to Users tab and set a user's role to "delivery_boy".
                                </div>
                            )}
                            {unassignedOrders.length === 0 ? (
                                <p className="text-muted-foreground text-sm py-4">No unassigned confirmed orders.</p>
                            ) : unassignedOrders.map(o => (
                                <div key={o.id} className="bg-card border border-border rounded-xl p-4 mb-3">
                                    <div className="flex items-start justify-between flex-wrap gap-2">
                                        <div>
                                            <p className="font-bold text-sm">{o.buyer_name} — ₹{o.total_amount?.toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground">{o.shipping_address?.city}, {o.shipping_address?.state} · {o.payment_method} · {o.items?.length} item(s)</p>
                                            {deliveryBoys.length > 0 && <p className="text-xs text-green-600 mt-0.5">Auto-assign to: {getAutoDeliveryBoy()?.full_name || getAutoDeliveryBoy()?.email}</p>}
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <select value={selectedDeliveryBoy[o.id] || ""} onChange={e => setSelectedDeliveryBoy(p => ({ ...p, [o.id]: e.target.value }))}
                                                className="border border-border rounded px-2 py-1.5 text-xs bg-background">
                                                <option value="">Auto-assign</option>
                                                {deliveryBoys.map(db => <option key={db.id} value={db.email}>{db.full_name || db.email}</option>)}
                                            </select>
                                            <Button size="sm" onClick={() => assignDelivery(o)} disabled={assigning === o.id} className="bg-orange-400 hover:bg-orange-500 text-white text-xs h-7">
                                                {assigning === o.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Assign"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div>
                            <h2 className="font-bold mb-2">All Delivery Assignments</h2>
                            <div className="bg-card border border-border rounded-xl overflow-auto">
                                <table className="w-full text-xs min-w-[600px]">
                                    <thead className="bg-muted"><tr>{["Order", "Partner", "Customer", "Status", "Amount", "COD"].map(h => <th key={h} className="text-left px-3 py-2.5 font-semibold text-muted-foreground">{h}</th>)}</tr></thead>
                                    <tbody className="divide-y divide-border">
                                        {deliveries.map(d => (
                                            <tr key={d.id} className="hover:bg-muted/30">
                                                <td className="px-3 py-2 font-mono">{d.order_id?.slice(0, 8).toUpperCase()}</td>
                                                <td className="px-3 py-2">{d.delivery_boy_name}</td>
                                                <td className="px-3 py-2">{d.buyer_name}</td>
                                                <td className="px-3 py-2"><Badge className={`border-0 text-xs capitalize ${d.status === "delivered" ? "bg-green-100 text-green-700" : d.status === "failed" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{d.status}</Badge></td>
                                                <td className="px-3 py-2 font-medium">₹{d.total_amount?.toLocaleString()}</td>
                                                <td className="px-3 py-2">{d.payment_method === "COD" ? (d.cod_collected ? "✅ Collected" : "⏳ Pending") : "N/A"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {tab === "sellers" && (
                    <div className="space-y-3">
                        <h2 className="font-bold">Seller Applications ({sellerApps.filter(a => a.status === "pending").length} pending)</h2>
                        {sellerApps.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground"><Store className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No applications yet</p></div>
                        ) : sellerApps.map(app => (
                            <div key={app.id} className="bg-card border border-border rounded-xl p-5">
                                <div className="flex items-start justify-between flex-wrap gap-3">
                                    <div>
                                        <p className="font-bold">{app.business_name}</p>
                                        <p className="text-sm text-muted-foreground">{app.applicant_name} · {app.applicant_email}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{app.business_type} · {app.phone}</p>
                                        <p className="text-sm mt-2 max-w-xl">{app.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge className={`border-0 capitalize text-xs ${app.status === "approved" ? "bg-green-100 text-green-700" : app.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{app.status}</Badge>
                                        {app.status === "pending" && (
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={() => updateSellerAppStatus(app.id, "approved", app.applicant_email)} className="bg-green-500 hover:bg-green-600 text-white text-xs h-7">
                                                    <CheckCircle className="h-3 w-3 mr-1" /> Approve + Seller Role
                                                </Button>
                                                <Button size="sm" onClick={() => updateSellerAppStatus(app.id, "rejected", app.applicant_email)} className="bg-red-500 hover:bg-red-600 text-white text-xs h-7">
                                                    <XCircle className="h-3 w-3 mr-1" /> Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ANALYTICS */}
                {tab === "analytics" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="bg-card border border-border rounded-xl p-5">
                            <h3 className="font-bold mb-3">Revenue by Status</h3>
                            {[
                                { label: "Delivered", amount: totalRevenue, color: "bg-green-500" },
                                { label: "In Transit", amount: pendingRevenue, color: "bg-yellow-400" },
                                { label: "Cancelled", amount: orders.filter(o => o.status === "cancelled").reduce((s, o) => s + (o.total_amount || 0), 0), color: "bg-red-400" },
                            ].map(r => (
                                <div key={r.label} className="mb-3">
                                    <div className="flex justify-between text-sm mb-1"><span>{r.label}</span><span className="font-semibold">₹{r.amount.toLocaleString()}</span></div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className={`h-full ${r.color} rounded-full`} style={{ width: r.amount > 0 ? `${Math.min(100, (r.amount / (totalRevenue + pendingRevenue || 1)) * 100)}%` : "0%" }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5">
                            <h3 className="font-bold mb-3">Order Distribution</h3>
                            {["pending", "confirmed", "shipped", "delivered", "cancelled"].map(s => {
                                const count = orders.filter(o => o.status === s).length;
                                return (
                                    <div key={s} className="flex items-center gap-3 mb-2">
                                        <span className="text-sm capitalize w-20">{s}</span>
                                        <div className="flex-1 bg-muted rounded-full h-2">
                                            <div className={`h-2 rounded-full ${s === "delivered" ? "bg-green-500" : s === "cancelled" ? "bg-red-400" : s === "shipped" ? "bg-purple-500" : s === "confirmed" ? "bg-blue-500" : "bg-yellow-400"}`} style={{ width: orders.length ? `${(count / orders.length) * 100}%` : "0%" }} />
                                        </div>
                                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* NOTIFICATIONS */}
                {tab === "notifications" && (
                    <div className="max-w-xl space-y-4">
                        <h2 className="font-bold">Send Broadcast Notification</h2>
                        <div className="flex gap-2 flex-wrap">
                            {["offer", "order", "promo", "system"].map(t => (
                                <button key={t} onClick={() => setNotifForm(f => ({ ...f, type: t }))}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${notifForm.type === t ? "bg-orange-400 text-white border-orange-400" : "border-border hover:border-orange-300"}`}>{t}</button>
                            ))}
                        </div>
                        <div><label className="text-xs font-semibold uppercase text-muted-foreground">Title</label>
                            <input value={notifForm.title} onChange={e => setNotifForm(f => ({ ...f, title: e.target.value.slice(0, 100) }))} placeholder="e.g. 🔥 Flash Sale — 50% off!" className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background mt-1" />
                        </div>
                        <div><label className="text-xs font-semibold uppercase text-muted-foreground">Message</label>
                            <textarea value={notifForm.message} onChange={e => setNotifForm(f => ({ ...f, message: e.target.value.slice(0, 500) }))} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background mt-1 min-h-24 resize-none" />
                        </div>
                        <Button onClick={sendNotification} disabled={sendingNotif} className="bg-orange-400 hover:bg-orange-500 text-white gap-2">
                            {sendingNotif ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />} Send to All Users
                        </Button>
                    </div>
                )}

                {/* SETTINGS */}
                {tab === "settings" && (
                    <div className="max-w-lg space-y-5">
                        <div className="bg-card border border-border rounded-xl p-5">
                            <h2 className="font-bold mb-1 flex items-center gap-2"><Settings className="h-4 w-4" /> Payment Settings</h2>
                            <p className="text-sm text-muted-foreground mb-4">UPI ID to receive all online payments. COD is collected by delivery partners.</p>
                            <div>
                                <label className="text-xs font-semibold uppercase text-muted-foreground">UPI ID</label>
                                <Input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="e.g. omnishop@hdfc" className="mt-1" />
                                <p className="text-xs text-muted-foreground mt-1">Customers will see this as the payment destination</p>
                            </div>
                            <Button onClick={saveUpiSettings} disabled={savingSettings} className="mt-4 bg-orange-400 hover:bg-orange-500 text-white">
                                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Payment Settings"}
                            </Button>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5">
                            <h2 className="font-bold mb-3">Platform Stats</h2>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-muted rounded-lg p-3"><p className="text-2xl font-bold">{products.filter(p => p.is_active).length}</p><p className="text-xs text-muted-foreground">Active Products</p></div>
                                <div className="bg-muted rounded-lg p-3"><p className="text-2xl font-bold">{allUsers.filter(u => u.role === "seller").length}</p><p className="text-xs text-muted-foreground">Verified Sellers</p></div>
                                <div className="bg-muted rounded-lg p-3"><p className="text-2xl font-bold">{deliveryBoys.length}</p><p className="text-xs text-muted-foreground">Delivery Partners</p></div>
                                <div className="bg-muted rounded-lg p-3"><p className="text-2xl font-bold">{orders.filter(o => o.status === "delivered").length}</p><p className="text-xs text-muted-foreground">Completed Orders</p></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Product Edit Modal */}
            {showProductForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-card rounded-xl w-full max-w-lg p-6 my-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Edit Product (Admin)</h2>
                            <button onClick={() => setShowProductForm(false)}><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                            <div><Label>Title *</Label><Input value={productForm.title} onChange={e => setProductForm(f => ({ ...f, title: e.target.value }))} placeholder="Product name" /></div>
                            <div><Label>Description</Label><Textarea value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><Label>Price (₹) *</Label><Input type="number" value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} /></div>
                                <div><Label>Original Price (₹)</Label><Input type="number" value={productForm.original_price} onChange={e => setProductForm(f => ({ ...f, original_price: e.target.value }))} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><Label>Category *</Label>
                                    <select value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background">
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div><Label>Brand</Label><Input value={productForm.brand} onChange={e => setProductForm(f => ({ ...f, brand: e.target.value }))} /></div>
                            </div>
                            <div><Label>Stock Quantity</Label><Input type="number" value={productForm.stock} onChange={e => setProductForm(f => ({ ...f, stock: e.target.value }))} /></div>
                            <div><Label>Image URL</Label><Input value={productForm.images[0]} onChange={e => setProductForm(f => ({ ...f, images: [e.target.value] }))} placeholder="https://..." /></div>
                            <div><Label>Tags (comma separated)</Label><Input value={productForm.tags} onChange={e => setProductForm(f => ({ ...f, tags: e.target.value }))} placeholder="tag1, tag2" /></div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="active" checked={productForm.is_active} onChange={e => setProductForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                                <Label htmlFor="active">Active (visible to buyers)</Label>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <Button onClick={() => setShowProductForm(false)} variant="outline" className="flex-1">Cancel</Button>
                            <Button onClick={saveProduct} disabled={savingProduct} className="flex-1 bg-orange-400 hover:bg-orange-500 text-white">
                                {savingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
