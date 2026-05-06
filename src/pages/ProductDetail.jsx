import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getProduct, getReviews, createReview, getCartItems, addCartItem, updateCartItem, updateProduct, deleteReview } from "@/services/firestoreService";
import Navbar from "@/components/Navbar";
import StarRating from "@/components/StarRating";
import PageSeo from "@/components/seo/PageSeo";
import { toast } from "sonner";
import { ShoppingCart, Zap, ChevronLeft, Truck, Shield, RotateCcw, Star, Loader2, Share2, Check, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { buildProductSchema } from "@/seo/seoConfig";

export default function ProductDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [selectedImg, setSelectedImg] = useState(0);
    const [qty, setQty] = useState(1);
    const [loading, setLoading] = useState(true);
    const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", comment: "" });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [deletingReview, setDeletingReview] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!id || id === ':id') return;
        loadData();
        if (user) loadCartCount();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [prod, revs] = await Promise.all([
                getProduct(id),
                getReviews(id)
            ]);
            setProduct(prod);
            setReviews(revs);
        } catch (error) {
            console.error("Failed to load product:", error);
            toast.error("Failed to load product");
        }
        setLoading(false);
    };

    const loadCartCount = async () => {
        try {
            const items = await getCartItems(user.email);
            setCartCount(items.length);
        } catch (error) {
            console.error("Failed to load cart count:", error);
        }
    };

    const addToCart = async () => {
        if (!user) { navigate("/sign-in"); return; }
        try {
            const existing = await getCartItems(user.email);
            const cartItem = existing.find(i => i.product_id === id);
            if (cartItem) {
                await updateCartItem(cartItem.id, { quantity: cartItem.quantity + qty });
            } else {
                await addCartItem({
                    user_email: user.email, product_id: id,
                    title: product.title, price: product.price,
                    image: product.images?.[0] || "", quantity: qty,
                    seller_email: product.seller_email
                });
            }
            toast.success(`Added ${qty} item(s) to cart!`);
            loadCartCount();
        } catch (error) {
            console.error("Failed to add to cart:", error);
            toast.error("Failed to add to cart");
        }
    };

    const buyNow = () => {
        if (!user) { navigate("/sign-in"); return; }
        const directItem = {
            id: `direct_${Date.now()}`,
            product_id: id,
            title: product.title,
            price: product.price,
            image: product.images?.[0] || "",
            quantity: qty,
            seller_email: product.seller_email,
            is_direct: true
        };
        navigate("/checkout", { state: { directItem } });
    };

    const copyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const shareProduct = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: product.title,
                text: `Check out this ${product.title} on OmniShop!`,
                url: url,
            }).catch(console.error);
        } else {
            copyLink();
        }
    };

    const submitReview = async () => {
        if (!user) { navigate("/sign-in"); return; }
        if (!reviewForm.comment.trim()) { toast.error("Please write a review"); return; }
        setSubmittingReview(true);
        try {
            await createReview({
                product_id: id, reviewer_email: user.email,
                reviewer_name: user.full_name || user.email,
                rating: reviewForm.rating, title: reviewForm.title,
                comment: reviewForm.comment, verified_purchase: false
            });
            const allRevs = [...reviews, { rating: reviewForm.rating }];
            const avgRating = allRevs.reduce((s, r) => s + r.rating, 0) / allRevs.length;
            await updateProduct(id, { rating: Math.round(avgRating * 10) / 10, review_count: allRevs.length });
            toast.success("Review submitted!");
            setReviewForm({ rating: 5, title: "", comment: "" });
            loadData();
        } catch (error) {
            console.error("Failed to submit review:", error);
            toast.error("Failed to submit review");
        }
        setSubmittingReview(false);
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Delete this review?")) return;
        setDeletingReview(reviewId);
        try {
            await deleteReview(reviewId);
            const remainingRevs = reviews.filter(r => r.id !== reviewId);
            const avgRating = remainingRevs.length ? (remainingRevs.reduce((s, r) => s + r.rating, 0) / remainingRevs.length) : 0;
            await updateProduct(id, { rating: Math.round(avgRating * 10) / 10, review_count: remainingRevs.length });
            toast.success("Review deleted");
            loadData();
        } catch (error) {
            console.error("Failed to delete review:", error);
            toast.error("Failed to delete review");
        }
        setDeletingReview(null);
    };

    if (loading) return (
        <div className="min-h-screen bg-background">
            <Navbar cartCount={cartCount} />
            <div className="flex justify-center items-center py-32"><Loader2 className="h-10 w-10 animate-spin text-orange-400" /></div>
        </div>
    );

    if (!product) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="text-center py-32"><p className="text-xl">Product not found</p></div>
        </div>
    );

    const discount = product.original_price && product.original_price > product.price
        ? Math.round((1 - product.price / product.original_price) * 100) : null;

    const images = product.images?.length ? product.images : ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80"];

    return (
        <div className="min-h-screen bg-background">
            <PageSeo
                title={product ? `${product.title} | OmniShop` : "Product Details | OmniShop"}
                description={product?.description || `Shop ${product?.title || "premium products"} on OmniShop with secure checkout and fast delivery.`}
                canonicalPath={`/product/${id}`}
                ogType="product"
                ogImage={images[0]}
                schema={buildProductSchema(product)}
            />
            <Navbar cartCount={cartCount} />
            <div className="max-w-7xl mx-auto px-4 py-6">
                <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ChevronLeft className="h-4 w-4" /> Back to products
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    {/* Images */}
                    <div>
                        <div className="bg-white rounded-xl border border-border overflow-hidden aspect-square mb-3">
                            <img src={images[selectedImg]} alt={product.title} className="w-full h-full object-contain p-6" />
                        </div>
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {images.map((img, i) => (
                                    <button key={i} onClick={() => setSelectedImg(i)}
                                        className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden ${i === selectedImg ? "border-orange-400" : "border-border"}`}>
                                        <img src={img} alt="" className="w-full h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div>
                        <div className="flex justify-between items-start">
                            <Badge className="mb-2 bg-orange-100 text-orange-700 border-0">{product.category}</Badge>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={copyLink} className="text-muted-foreground hover:text-orange-500 gap-1.5 h-8">
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    <span className="text-xs font-medium">{copied ? "Copied" : "Copy Link"}</span>
                                </Button>
                                {navigator.share && (
                                    <Button variant="ghost" size="sm" onClick={shareProduct} className="text-muted-foreground hover:text-orange-500 gap-1.5 h-8">
                                        <Share2 className="h-4 w-4" />
                                        <span className="text-xs font-medium">Share</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold mb-1">{product.title}</h1>
                        {product.brand && <p className="text-muted-foreground text-sm mb-2">Brand: <span className="text-blue-600 font-medium">{product.brand}</span></p>}

                        <div className="flex items-center gap-3 mb-3">
                            <StarRating rating={product.rating} size="lg" showCount count={product.review_count} />
                        </div>

                        <div className="border-t border-b border-border py-4 mb-4">
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-bold">₹{product.price?.toLocaleString()}</span>
                                {discount && <Badge className="bg-green-100 text-green-700 border-0 text-sm">{discount}% off</Badge>}
                            </div>
                            {product.original_price && product.original_price > product.price && (
                                <p className="text-sm text-muted-foreground mt-1">M.R.P.: <span className="line-through">₹{product.original_price?.toLocaleString()}</span></p>
                            )}
                            <div className="mt-3 bg-orange-50 border border-orange-100 rounded-lg p-3">
                                <p className="text-sm text-orange-700">
                                    <span className="font-bold">FREE delivery</span> by <b>{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</b>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            <label className="text-sm font-medium">Quantity:</label>
                            <div className="flex items-center border border-border rounded-md">
                                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-1 hover:bg-muted">-</button>
                                <span className="px-4 py-1 font-medium">{qty}</span>
                                <button onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))} className="px-3 py-1 hover:bg-muted">+</button>
                            </div>
                            {product.stock <= 5 && product.stock > 0 && (
                                <span className="text-red-500 text-sm font-medium">Only {product.stock} left!</span>
                            )}
                        </div>

                        <div className="flex gap-3 mb-6">
                            <Button onClick={addToCart} variant="outline" className="flex-1 gap-2 border-orange-400 text-orange-600 hover:bg-orange-50">
                                <ShoppingCart className="h-4 w-4" /> Add to Cart
                            </Button>
                            <Button onClick={buyNow} className="flex-1 gap-2 bg-orange-400 hover:bg-orange-500 text-white">
                                <Zap className="h-4 w-4" /> Buy Now
                            </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center">
                            {(() => {
                                const isCostlyElectronic = product.category === "Electronics" && product.price >= 5000;
                                const features = [
                                    { icon: Truck, label: "Free Delivery" },
                                    { icon: RotateCcw, label: "7 Day Return" }
                                ];
                                if (isCostlyElectronic) {
                                    features.splice(1, 0, { icon: Shield, label: "6 Months Warranty" });
                                }
                                return features.map(({ icon: Icon, label }) => (
                                    <div key={label} className="bg-muted rounded-lg p-3">
                                        <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-xs font-medium">{label}</p>
                                    </div>
                                ));
                            })()}
                        </div>

                        {product.description && (
                            <div className="mt-4">
                                <h3 className="font-semibold mb-2">About this item</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Amazon-Style Reviews */}
                <div className="border-t border-border pt-8 mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        
                        {/* Left Column: Rating Summary & Write Review */}
                        <div className="md:col-span-4 space-y-6">
                            <div>
                                <h2 className="text-xl font-bold mb-3">Customer Reviews</h2>
                                <div className="flex items-center gap-3 mb-2">
                                    <StarRating rating={product.rating} size="lg" />
                                    <span className="text-lg font-medium">{Number(product.rating || 0).toFixed(1)} out of 5</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{product.review_count || 0} global ratings</p>
                            </div>

                            <div className="space-y-2">
                                {[5, 4, 3, 2, 1].map(star => {
                                    const count = reviews.filter(r => Math.round(r.rating) === star).length;
                                    const percent = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                                    return (
                                        <div key={star} className="flex items-center gap-3 text-sm">
                                            <span className="w-12 text-blue-600 hover:text-orange-500 hover:underline cursor-pointer">{star} star</span>
                                            <div className="flex-1 h-4 bg-muted border border-border rounded-sm overflow-hidden">
                                                <div className="h-full bg-orange-400" style={{ width: `${percent}%` }} />
                                            </div>
                                            <span className="w-10 text-right text-muted-foreground">{percent}%</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="border-t border-border pt-6">
                                <h3 className="font-semibold text-lg mb-2">Review this product</h3>
                                <p className="text-sm text-muted-foreground mb-4">Share your thoughts with other customers</p>
                                <Button onClick={() => document.getElementById('review-form').scrollIntoView({behavior: 'smooth'})} className="w-full bg-white text-black border border-gray-300 hover:bg-gray-50 shadow-sm">
                                    Write a product review
                                </Button>
                            </div>
                        </div>

                        {/* Right Column: Review List */}
                        <div className="md:col-span-8">
                            <h3 className="font-bold text-lg mb-4">Top reviews from India</h3>
                            <div className="space-y-6">
                                {reviews.length === 0 ? (
                                    <p className="text-muted-foreground py-4">No reviews yet. Be the first to review this product!</p>
                                ) : reviews.map(r => (
                                    <div key={r.id} className="border-b border-border pb-6 last:border-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-500 text-sm">
                                                    {r.reviewer_name?.charAt(0).toUpperCase() || "U"}
                                                </div>
                                                <span className="font-medium text-sm">{r.reviewer_name}</span>
                                            </div>
                                            {user?.email === r.reviewer_email && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleDeleteReview(r.id)}
                                                    disabled={deletingReview === r.id}
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                                                >
                                                    {deletingReview === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <StarRating rating={r.rating} size="sm" />
                                            {r.title && <span className="font-bold text-sm">{r.title}</span>}
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-2">Reviewed on {r.created_date ? new Date(r.created_date.seconds ? r.created_date.toDate() : r.created_date).toLocaleDateString() : 'recently'}</p>
                                        <p className="text-xs text-orange-600 font-semibold mb-2 flex items-center gap-1">
                                            Verified Purchase
                                        </p>
                                        <p className="text-sm text-foreground leading-relaxed">{r.comment}</p>
                                        <div className="mt-3">
                                            <Button variant="outline" size="sm" className="text-xs text-gray-600">Helpful</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Write Review Form */}
                            <div id="review-form" className="mt-12 bg-gray-50 border border-border rounded-xl p-6">
                                <h3 className="font-bold text-lg mb-4">Add your review</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Overall rating</label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <button key={s} onClick={() => setReviewForm(f => ({ ...f, rating: s }))}>
                                                    <Star className={`h-8 w-8 ${s <= reviewForm.rating ? "fill-orange-400 text-orange-400" : "text-gray-300 hover:text-orange-200 transition-colors"}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Add a headline</label>
                                        <Input placeholder="What's most important to know?" value={reviewForm.title} onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))} className="bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Add a written review</label>
                                        <Textarea placeholder="What did you like or dislike? What did you use this product for?" value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} rows={4} className="bg-white" />
                                    </div>
                                    <Button onClick={submitReview} disabled={submittingReview} className="bg-orange-400 hover:bg-orange-500 text-white shadow-sm px-8">
                                        {submittingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Submit
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}