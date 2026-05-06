import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/firebase/firebaseConfig";
import { getCartItems, updateUserProfile } from "@/services/firestoreService";
import Navbar from "@/components/Navbar";
import { finalizeOrderSecurely } from "@/services/firstOrderVerificationService";

import { toast } from "sonner";
import { Loader2, CheckCircle, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiBase } from "@/lib/apiConfig";

const PAYMENT_METHODS = ["COD", "Card", "UPI"];

export default function Checkout() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [editingAddress, setEditingAddress] = useState(false);
    const [addr, setAddr] = useState({ name: "", phone: "", address: "", city: "", state: "", pincode: "" });

    useEffect(() => {
        if (!user) { navigate("/sign-in"); return; }
        loadData();
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Check for direct buy item from ProductDetail
            if (location.state?.directItem) {
                setCartItems([location.state.directItem]);
            } else {
                const data = await getCartItems(user.email);
                if (data.length === 0) { navigate("/cart"); return; }
                setCartItems(data);
            }

            if (user.shipping_address?.address) {
                setAddr(user.shipping_address);
            } else {
                setAddr({ name: user.full_name || "", phone: user.phone || "", address: "", city: "", state: "", pincode: "" });
                setEditingAddress(true);
            }
        } catch (error) {
            console.error("Failed to load checkout data:", error);
            toast.error("Failed to load checkout details");
        }
        setLoading(false);
    };

    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal > 500 ? 0 : 49;
    const total = subtotal + shipping;

    const validateAddress = () => {
        const { name, phone, address, city, state, pincode } = addr;
        return name && phone && address && city && state && pincode;
    };

    const handleProceed = async () => {
        if (!validateAddress()) { toast.error("Please fill all address fields"); return; }
        
        setPlacing(true);
        // If address was being edited, save it first
        if (editingAddress) {
            try {
                await updateUserProfile(user.uid, { shipping_address: addr });
                setEditingAddress(false);
            } catch (error) {
                console.error("Failed to save address:", error);
            }
        }

        try {
            if (paymentMethod === "COD") {
                await finalizeOrder("pending");
            } else {
                await createStripeCheckout();
            }
        } catch (error) {
            console.error("Checkout process failed:", error);
            setPlacing(false);
        }
    };

    const createStripeCheckout = async () => {
        try {
            // Store order data in localStorage to pick up in PaymentSuccess
            const orderData = {
                buyer_email: user.email, buyer_name: user.full_name || user.email,
                items: cartItems.map(i => ({
                    product_id: i.product_id, title: i.title, price: i.price,
                    quantity: i.quantity, image: i.image, seller_email: i.seller_email,
                    is_direct: i.is_direct || false,
                    cart_item_id: i.is_direct ? null : i.id
                })),
                total_amount: total,
                shipping_address: addr, payment_method: paymentMethod,
            };
            localStorage.setItem('pending_order', JSON.stringify(orderData));

            const token = await auth.currentUser.getIdToken();
            const response = await fetch(`${getApiBase()}/api/stripe/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    amount: total,
                    items: cartItems.map(item => ({
                        name: item.title,
                        price: item.price,
                        quantity: item.quantity,
                        description: item.description || `Seller: ${item.seller_email}`
                    })),
                    origin: window.location.origin
                }),
            });
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to create checkout session');
            }
            
            const { url } = await response.json();
            if (url) {
                window.location.href = url;
            } else {
                throw new Error('No checkout URL received from server');
            }
        } catch (error) {
            console.error('Stripe checkout error:', error);
            toast.error('Payment Error: ' + error.message);
            throw error;
        }
    };

    const finalizeOrder = async (paymentStatus) => {
        try {
            await finalizeOrderSecurely({
                buyer_email: user.email, buyer_name: user.full_name || user.email,
                items: cartItems.map(i => ({
                    product_id: i.product_id, title: i.title, price: i.price,
                    quantity: i.quantity, image: i.image, seller_email: i.seller_email,
                    cart_item_id: i.is_direct ? null : i.id
                })),
                total_amount: total, status: "confirmed",
                shipping_address: addr, payment_method: paymentMethod,
                payment_status: paymentStatus,
                delivery_estimate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });
            setSuccess(true);
        } catch (error) {
            console.error("Failed to place order:", error);
            toast.error("Failed to place order");
            throw error;
        } finally {
            setPlacing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-orange-400" /></div>
        </div>
    );

    if (success) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <CheckCircle className="h-20 w-20 text-green-500 mb-4" />
                <h1 className="text-3xl font-bold mb-2">Order Placed Successfully!</h1>
                <p className="text-muted-foreground mb-2 max-w-md">Thank you for your purchase. Your order has been confirmed.</p>
                {paymentMethod === "COD" && <p className="text-sm text-orange-600 font-medium mb-6">Cash on Delivery — Pay when your order arrives</p>}
                {paymentMethod !== "COD" && <p className="text-sm text-green-600 font-medium mb-6">Payment of ₹{total.toLocaleString()} received successfully</p>}
                <div className="flex gap-3">
                    <Button onClick={() => navigate("/orders")} className="bg-orange-400 hover:bg-orange-500 text-white">View My Orders</Button>
                    <Button onClick={() => navigate("/")} variant="outline">Continue Shopping</Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar cartCount={cartItems.length} />
            {placing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-card rounded-xl p-8 text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-orange-400 mx-auto mb-3" />
                        <p className="font-semibold">Placing your order...</p>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold mb-6">Checkout</h1>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-4">
                        {/* Address */}
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold">Delivery Address</h2>
                                {!editingAddress && (
                                    <Button variant="ghost" size="sm" onClick={() => setEditingAddress(true)} className="gap-1 text-orange-500">
                                        <Edit2 className="h-3 w-3" /> Change
                                    </Button>
                                )}
                            </div>
                            {editingAddress ? (
                                <div className="space-y-4">
                                    <div className="p-3 bg-muted rounded-lg border border-border flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-semibold">{addr.name || user.full_name}</p>
                                            <p className="text-xs text-muted-foreground">{addr.phone || user.phone}</p>
                                        </div>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Contact Info</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <Label>Address *</Label>
                                            <Input 
                                                value={addr.address} 
                                                onChange={e => setAddr(a => ({ ...a, address: e.target.value.slice(0, 500) }))} 
                                                placeholder="House no, Street, Locality" 
                                            />
                                        </div>
                                        <div>
                                            <Label>City *</Label>
                                            <Input 
                                                value={addr.city} 
                                                onChange={e => setAddr(a => ({ ...a, city: e.target.value.slice(0, 100) }))} 
                                                placeholder="City" 
                                            />
                                        </div>
                                        <div>
                                            <Label>State *</Label>
                                            <Input 
                                                value={addr.state} 
                                                onChange={e => setAddr(a => ({ ...a, state: e.target.value.slice(0, 100) }))} 
                                                placeholder="State" 
                                            />
                                        </div>
                                        <div>
                                            <Label>Pincode *</Label>
                                            <Input 
                                                value={addr.pincode} 
                                                onChange={e => setAddr(a => ({ ...a, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} 
                                                placeholder="6-digit PIN" 
                                            />
                                        </div>
                                        
                                        <div className="col-span-2 pt-2 border-t border-border mt-2">
                                            <p className="text-[10px] text-muted-foreground mb-3 uppercase font-bold">Need to change contact info for this order?</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs">Full Name</Label>
                                                    <Input 
                                                        className="h-8 text-sm"
                                                        value={addr.name} 
                                                        onChange={e => setAddr(a => ({ ...a, name: e.target.value.slice(0, 100) }))} 
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Phone Number</Label>
                                                    <Input 
                                                        className="h-8 text-sm"
                                                        value={addr.phone} 
                                                        onChange={e => setAddr(a => ({ ...a, phone: e.target.value.replace(/\D/g, "").slice(0, 15) }))} 
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-2 mt-4 flex gap-3">
                                            <Button 
                                                onClick={async () => {
                                                    if (!validateAddress()) { toast.error("Fill all fields"); return; }
                                                    try {
                                                        await updateUserProfile(user.uid, { shipping_address: addr });
                                                        setEditingAddress(false); 
                                                        toast.success("Address saved!");
                                                    } catch (e) {
                                                        toast.error("Failed to save address");
                                                    }
                                                }} 
                                                className="bg-orange-400 hover:bg-orange-500 text-white flex-1"
                                            >
                                                Save Address
                                            </Button>
                                            {user.shipping_address?.address && (
                                                <Button variant="outline" onClick={() => {
                                                    setAddr(user.shipping_address);
                                                    setEditingAddress(false);
                                                }}>Cancel</Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-muted rounded-lg p-3 text-sm space-y-0.5">
                                    <p className="font-semibold">{addr.name}</p>
                                    <p>{addr.phone}</p>
                                    <p>{addr.address}</p>
                                    <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                                </div>
                            )}
                        </div>

                        {/* Payment */}
                        <div className="bg-card border border-border rounded-xl p-5">
                            <h2 className="font-bold mb-4 text-lg">Payment Method</h2>
                            <div className="space-y-3">
                                {PAYMENT_METHODS.map(m => (
                                    <div key={m} 
                                        onClick={() => setPaymentMethod(m)}
                                        className={`flex items-center gap-3 border rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === m ? "border-orange-400 bg-orange-50/50 ring-1 ring-orange-400" : "border-border hover:border-orange-200"}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === m ? "border-orange-500" : "border-muted-foreground/30"}`}>
                                            {paymentMethod === m && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold flex items-center gap-2">
                                                {m === "COD" && "💵 Cash on Delivery (COD)"}
                                                {m === "Card" && "💳 Credit / Debit Card"}
                                                {m === "UPI" && "📱 UPI (GPay, PhonePe, etc.)"}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {m === "COD" && "Pay in cash at the time of delivery"}
                                                {m !== "COD" && "Secure payment via Stripe"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {paymentMethod !== "COD" && (
                                <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3">
                                    <div className="bg-blue-100 p-1.5 rounded-full">
                                        <CheckCircle className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">Secure Payment Redirect</p>
                                        <p className="text-xs text-blue-700 mt-0.5">You will be redirected to Stripe to securely complete your payment. All major cards and UPI are supported.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-2">
                        <div className="bg-card border border-border rounded-xl p-6 sticky top-24 shadow-sm">
                            <h2 className="font-bold mb-4 text-lg text-orange-600">Order Summary</h2>
                            <div className="space-y-3 mb-6 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex gap-3 text-sm">
                                        <div className="relative">
                                            <img src={item.image || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=80"} alt="" className="w-14 h-14 object-cover rounded-lg bg-gray-50 border border-gray-100" />
                                            <span className="absolute -top-2 -right-2 bg-orange-400 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                                {item.quantity}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate font-medium text-gray-800">{item.title}</p>
                                            <p className="text-muted-foreground text-xs mt-0.5">Sold by: {item.seller_email?.split('@')[0] || "OmniShop"}</p>
                                        </div>
                                        <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="space-y-3 border-t border-border pt-4 text-sm">
                                <div className="flex justify-between text-gray-600"><span>Items Total</span><span>₹{subtotal.toLocaleString()}</span></div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery Fee</span>
                                    <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                                        {shipping === 0 ? "FREE" : `₹${shipping}`}
                                    </span>
                                </div>
                                <div className="flex justify-between font-bold text-xl pt-4 border-t border-dashed border-border mt-2 text-gray-900">
                                    <span>Total Payable</span>
                                    <span>₹{total.toLocaleString()}</span>
                                </div>
                            </div>

                            <Button 
                                onClick={handleProceed} 
                                disabled={placing} 
                                className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 text-lg shadow-lg shadow-orange-200 transition-all hover:scale-[1.01]"
                            >
                                {placing ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>{paymentMethod === "COD" ? "Placing Order..." : "Redirecting to Stripe..."}</span>
                                    </div>
                                ) : (
                                    paymentMethod === "COD" ? `Place Order - ₹${total.toLocaleString()}` : `Pay ₹${total.toLocaleString()} Securely`
                                )}
                            </Button>
                            
                            <p className="text-[10px] text-center text-muted-foreground mt-4">
                                By placing your order, you agree to OmniShop's <span className="underline cursor-pointer">Terms & Conditions</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
