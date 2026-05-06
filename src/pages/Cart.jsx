import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getCartItems, updateCartItem, deleteCartItem } from "@/services/firestoreService";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { Trash2, Plus, Minus, ShoppingBag, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Cart() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { navigate("/sign-in"); return; }
        loadCart();
    }, [user]);

    const loadCart = async () => {
        setLoading(true);
        try {
            const data = await getCartItems(user.email);
            setItems(data);
        } catch (error) {
            console.error("Failed to load cart:", error);
            toast.error("Failed to load cart");
        }
        setLoading(false);
    };

    const updateQty = async (item, newQty) => {
        if (newQty < 1) { removeItem(item); return; }
        try {
            await updateCartItem(item.id, { quantity: newQty });
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
        } catch (error) {
            console.error("Failed to update quantity:", error);
            toast.error("Failed to update quantity");
        }
    };

    const removeItem = async (item) => {
        try {
            await deleteCartItem(item.id);
            setItems(prev => prev.filter(i => i.id !== item.id));
            toast.success("Removed from cart");
        } catch (error) {
            console.error("Failed to remove item:", error);
            toast.error("Failed to remove item");
        }
    };

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal > 500 ? 0 : 49;
    const total = subtotal + shipping;

    if (loading) return (
        <div className="min-h-screen bg-background">
            <Navbar cartCount={0} />
            <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-orange-400" /></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar cartCount={items.length} />
            <div className="max-w-6xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

                {items.length === 0 ? (
                    <div className="text-center py-24">
                        <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-xl font-semibold mb-2">Your cart is empty</p>
                        <p className="text-muted-foreground mb-6">Add items to get started</p>
                        <Link to="/"><Button className="bg-orange-400 hover:bg-orange-500 text-white">Continue Shopping</Button></Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-3">
                            {items.map(item => (
                                <div key={item.id} className="bg-card border border-border rounded-xl p-3 sm:p-4 flex gap-3">
                                    <Link to={`/product/${item.product_id}`} className="flex-shrink-0">
                                        <img src={item.image || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&q=80"}
                                            alt={item.title} className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-lg bg-gray-50" />
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link to={`/product/${item.product_id}`}>
                                            <p className="font-medium text-sm line-clamp-2 hover:text-orange-500">{item.title}</p>
                                        </Link>
                                        <p className="text-base font-bold mt-1">₹{(item.price * item.quantity).toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">₹{item.price?.toLocaleString()} each</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex items-center border border-border rounded-md">
                                                <button onClick={() => updateQty(item, item.quantity - 1)} className="px-2 py-1 hover:bg-muted"><Minus className="h-3 w-3" /></button>
                                                <span className="px-2 py-1 text-sm font-medium">{item.quantity}</span>
                                                <button onClick={() => updateQty(item, item.quantity + 1)} className="px-2 py-1 hover:bg-muted"><Plus className="h-3 w-3" /></button>
                                            </div>
                                            <button onClick={() => removeItem(item)} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1">
                                                <Trash2 className="h-3 w-3" /> Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-card border border-border rounded-xl p-5 h-fit sticky top-24">
                            <h2 className="font-bold text-lg mb-4">Order Summary</h2>
                            <div className="space-y-2 text-sm mb-4">
                                <div className="flex justify-between"><span>Subtotal ({items.length} items)</span><span>₹{subtotal.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span>Delivery</span><span className={shipping === 0 ? "text-green-600" : ""}>{shipping === 0 ? "FREE" : `₹${shipping}`}</span></div>
                                {shipping > 0 && <p className="text-xs text-muted-foreground">Add ₹{(500 - subtotal).toLocaleString()} more for free delivery</p>}
                            </div>
                            <div className="border-t border-border pt-3 flex justify-between font-bold text-lg mb-5">
                                <span>Total</span><span>₹{total.toLocaleString()}</span>
                            </div>
                            <Button onClick={() => navigate("/checkout")} className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold gap-1">
                                Proceed to Checkout <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}