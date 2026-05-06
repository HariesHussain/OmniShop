import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getProductsBySeller, createProduct, updateProduct, deleteProduct, getOrdersBySeller } from "@/services/firestoreService";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Package, DollarSign, ShoppingBag, Star, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = ["Electronics", "Clothing", "Books", "Home & Kitchen", "Sports", "Beauty", "Toys", "Automotive", "Grocery", "Other"];

const emptyForm = { title: "", description: "", price: "", original_price: "", category: "Electronics", brand: "", images: [""], stock: "", tags: "", is_active: true };

export default function SellerDashboard() {
    const { user, isLoadingAuth } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isLoadingAuth) return;
        if (!user) { navigate("/sign-in"); return; }
        if (user.role !== "seller" && user.role !== "admin") { 
            navigate("/seller/apply"); 
            return; 
        }
        loadDashboardData();
    }, [user, isLoadingAuth]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [prods, ords] = await Promise.all([
                getProductsBySeller(user.email),
                getOrdersBySeller(user.email)
            ]);
            setProducts(prods || []);
            setOrders(ords || []);
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
            toast.error("Failed to load dashboard statistics");
        }
        setLoading(false);
    };

    const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
    const openEdit = (p) => {
        setForm({ ...p, price: String(p.price || ""), original_price: String(p.original_price || ""), stock: String(p.stock || ""), images: p.images?.length ? p.images : [""], tags: Array.isArray(p.tags) ? p.tags.join(", ") : "" });
        setEditId(p.id); setShowForm(true);
    };

    const saveProduct = async () => {
        if (!form.title || !form.price || !form.category) { toast.error("Fill required fields"); return; }
        setSaving(true);
        try {
            const data = {
                title: form.title, description: form.description || "", price: Number(form.price) || 0,
                original_price: form.original_price ? Number(form.original_price) : undefined,
                category: form.category, brand: form.brand || "",
                images: Array.isArray(form.images) ? form.images.filter(Boolean) : [], 
                stock: Number(form.stock) || 0,
                seller_email: user.email, seller_name: user.full_name || user.email,
                is_active: form.is_active, is_featured: false,
                tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : []
            };
            if (editId) await updateProduct(editId, data);
            else await createProduct(data);
            toast.success(editId ? "Product updated!" : "Product listed!");
            setShowForm(false); loadDashboardData();
        } catch (error) {
            console.error("Failed to save product:", error);
            toast.error(editId ? "Failed to update product" : "Failed to create product");
        }
        setSaving(false);
    };

    const handleDeleteProduct = async (pid) => {
        if (!window.confirm("Delete this product?")) return;
        try {
            await deleteProduct(pid);
            toast.success("Product deleted");
            loadDashboardData();
        } catch (error) {
            console.error("Failed to delete product:", error);
            toast.error("Failed to delete product");
        }
    };

    const totalRevenue = (orders || []).reduce((s, o) => {
        const myItems = o.items?.filter(i => i.seller_email === user.email) || [];
        return s + myItems.reduce((ss, i) => ss + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
    }, 0);

    const stats = [
        { label: "Products Listed", value: products.length, icon: Package, color: "text-blue-500" },
        { label: "Total Orders", value: orders.length, icon: ShoppingBag, color: "text-orange-500" },
        { label: "Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-500" },
        { label: "Avg Rating", value: products.length ? (products.reduce((s, p) => s + (p.rating || 0), 0) / products.length).toFixed(1) : "N/A", icon: Star, color: "text-yellow-500" },
    ];

    if (loading) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-orange-400" /></div>
        </div>
    );

    const sortedOrders = [...orders].sort((a, b) => {
        const dateA = a.created_date?.toMillis ? a.created_date.toMillis() : new Date(a.created_date || 0).getTime();
        const dateB = b.created_date?.toMillis ? b.created_date.toMillis() : new Date(b.created_date || 0).getTime();
        return dateB - dateA;
    });

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Seller Dashboard</h1>
                        <p className="text-muted-foreground text-sm">Welcome, {user.full_name || user.email}</p>
                    </div>
                    <Button onClick={openAdd} className="bg-orange-400 hover:bg-orange-500 text-white gap-1">
                        <Plus className="h-4 w-4" /> Add Product
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map(s => {
                        const Icon = s.icon;
                        return (
                            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                                <Icon className={`h-6 w-6 mb-2 ${s.color}`} />
                                <p className="text-2xl font-bold">{s.value}</p>
                                <p className="text-sm text-muted-foreground">{s.label}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Products */}
                <h2 className="text-lg font-bold mb-3">My Products</h2>
                {products.length === 0 ? (
                    <div className="text-center py-12 bg-card border border-border rounded-xl">
                        <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="font-semibold">No products yet</p>
                        <p className="text-muted-foreground text-sm mb-4">Add your first product to start selling</p>
                        <Button onClick={openAdd} className="bg-orange-400 hover:bg-orange-500 text-white">Add Product</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {products.map(p => (
                            <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
                                <img src={p.images?.[0] || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"} alt={p.title} className="w-full h-36 object-contain bg-gray-50" />
                                <div className="p-3">
                                    <p className="font-medium text-sm line-clamp-1">{p.title}</p>
                                    <p className="text-orange-500 font-bold">₹{p.price?.toLocaleString()}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <Badge className={`border-0 text-xs ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                            {p.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">Stock: {p.stock || 0}</span>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="flex-1 gap-1"><Edit className="h-3 w-3" /> Edit</Button>
                                        <Button size="sm" variant="outline" onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:text-red-700 gap-1"><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Recent Orders */}
                <h2 className="text-lg font-bold mb-3">Recent Orders</h2>
                {orders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8 bg-card border border-border rounded-xl">No orders yet</p>
                ) : (
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted"><tr>{["Order ID", "Buyer", "Items", "Amount", "Status", "Date"].map(h => <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground">{h}</th>)}</tr></thead>
                            <tbody className="divide-y divide-border">
                                {sortedOrders.slice(0, 10).map(o => (
                                    <tr key={o.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8).toUpperCase()}</td>
                                        <td className="px-4 py-3 truncate max-w-32">{o.buyer_name}</td>
                                        <td className="px-4 py-3">{o.items?.length}</td>
                                        <td className="px-4 py-3 font-medium">₹{o.total_amount?.toLocaleString()}</td>
                                        <td className="px-4 py-3"><Badge className="capitalize border-0 text-xs bg-blue-100 text-blue-700">{o.status}</Badge></td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {o.created_date?.seconds 
                                                ? new Date(o.created_date.seconds * 1000).toLocaleDateString() 
                                                : new Date(o.created_date || Date.now()).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Product Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-card rounded-xl w-full max-w-lg p-6 my-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">{editId ? "Edit Product" : "Add New Product"}</h2>
                            <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Product name" /></div>
                            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><Label>Price (₹) *</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
                                <div><Label>Original Price (₹)</Label><Input type="number" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><Label>Category *</Label>
                                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background">
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div><Label>Brand</Label><Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} /></div>
                            </div>
                            <div><Label>Stock Quantity</Label><Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
                            <div><Label>Image URL</Label><Input value={form.images[0]} onChange={e => setForm(f => ({ ...f, images: [e.target.value] }))} placeholder="https://..." /></div>
                            <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="tag1, tag2" /></div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                                <Label htmlFor="active">Active (visible to buyers)</Label>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">Cancel</Button>
                            <Button onClick={saveProduct} disabled={saving} className="flex-1 bg-orange-400 hover:bg-orange-500 text-white">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editId ? "Update" : "Publish")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}