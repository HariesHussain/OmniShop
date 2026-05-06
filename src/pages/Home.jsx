import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getProducts, getCartItems, addCartItem, updateCartItem } from "@/services/firestoreService";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { toast } from "sonner";
import { Loader2, SlidersHorizontal, X, ChevronRight, ChevronLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

const CATEGORIES = [
    { name: "Electronics", emoji: "📱", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { name: "Clothing", emoji: "👗", color: "bg-pink-50 text-pink-700 border-pink-200" },
    { name: "Books", emoji: "📚", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    { name: "Home & Kitchen", emoji: "🏠", color: "bg-green-50 text-green-700 border-green-200" },
    { name: "Sports", emoji: "⚽", color: "bg-orange-50 text-orange-700 border-orange-200" },
    { name: "Beauty", emoji: "💄", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { name: "Toys", emoji: "🧸", color: "bg-red-50 text-red-700 border-red-200" },
    { name: "Automotive", emoji: "🚗", color: "bg-gray-50 text-gray-700 border-gray-200" },
    { name: "Grocery", emoji: "🛒", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

const HERO_SLIDES = [
    {
        bg: "from-[#131921] to-[#232f3e]",
        headline: "Great Indian Sale",
        sub: "Up to 80% off on Electronics, Fashion & more",
        cta: "Shop Electronics",
        badge: "LIMITED TIME",
        img: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=900&q=80",
        color: "text-orange-400",
        link: "/?category=Electronics",
    },
    {
        bg: "from-[#0f3460] to-[#16213e]",
        headline: "New Arrivals in Fashion",
        sub: "Trending styles curated just for you — new drops every day",
        cta: "Explore Fashion",
        badge: "NEW IN",
        img: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&q=80",
        color: "text-cyan-300",
        link: "/?category=Clothing",
    },
    {
        bg: "from-[#1a4731] to-[#0d2818]",
        headline: "Home Makeover Event",
        sub: "Transform every room with premium home essentials",
        cta: "Shop Home",
        badge: "BEST SELLERS",
        img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=80",
        color: "text-green-300",
        link: "/?category=Home+%26+Kitchen",
    },
    {
        bg: "from-[#4a0e0e] to-[#2d0808]",
        headline: "Books that Change Lives",
        sub: "Bestsellers, new releases & classics at unbeatable prices",
        cta: "Browse Books",
        badge: "TOP RATED",
        img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&q=80",
        color: "text-red-300",
        link: "/?category=Books",
    },
];

const DEALS = [
    { label: "Deal of the Day", icon: "🔥", category: "Electronics" },
    { label: "Best Sellers", icon: "⭐", category: "Books" },
    { label: "New Arrivals", icon: "✨", category: "Clothing" },
    { label: "Top Rated", icon: "🏆", category: "Sports" },
];

export default function Home() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get("search") || "";
    const categoryFilter = searchParams.get("category") || "";

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const [bannerIdx, setBannerIdx] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ minPrice: 0, maxPrice: 200000, minRating: 0 });
    const [sortBy, setSortBy] = useState("newest");
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef(null);
    const heroTimerRef = useRef(null);

    useEffect(() => { loadProducts(); }, []);
    useEffect(() => { if (user) loadCartCount(); }, [user]);
    useEffect(() => {
        heroTimerRef.current = setInterval(() => setBannerIdx(i => (i + 1) % HERO_SLIDES.length), 5000);
        return () => clearInterval(heroTimerRef.current);
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error("Failed to load products:", error);
            toast.error("Failed to load products");
        }
        setLoading(false);
    };

    const loadCartCount = async () => {
        try {
            const items = await getCartItems(user.email);
            setCartCount(items.length);
        } catch (error) {
            console.error("Failed to load cart:", error);
        }
    };

    const addToCart = async (product) => {
        if (!user) { navigate("/sign-in"); return; }
        try {
            const existing = await getCartItems(user.email);
            const cartItem = existing.find(item => item.product_id === product.id);
            if (cartItem) {
                await updateCartItem(cartItem.id, { quantity: cartItem.quantity + 1 });
            } else {
                await addCartItem({
                    user_email: user.email,
                    product_id: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.images?.[0] || "",
                    quantity: 1,
                    seller_email: product.seller_email
                });
            }
            toast.success("Added to cart!");
            loadCartCount();
        } catch (error) {
            console.error("Failed to add to cart:", error);
            toast.error("Failed to add to cart");
        }
    };

    const startVoiceSearch = useCallback(() => {
        if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
            toast.error("Voice search not supported on this browser"); return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = "en-IN";
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            setListening(false);
            toast.success(`Searching for: "${transcript}"`);
            window.location.href = `/?search=${encodeURIComponent(transcript)}`;
        };
        recognitionRef.current.onerror = () => setListening(false);
        recognitionRef.current.onend = () => setListening(false);
        recognitionRef.current.start();
        setListening(true);
        toast.success("Listening... Speak now");
    }, [navigate]);

    let filtered = products.filter(p => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !searchQuery || p.title?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.tags?.some(t => t.toLowerCase().includes(q));
        const matchCat = !categoryFilter || p.category === categoryFilter;
        const matchPrice = p.price >= filters.minPrice && p.price <= filters.maxPrice;
        const matchRating = !filters.minRating || (p.rating || 0) >= filters.minRating;
        return matchSearch && matchCat && matchPrice && matchRating;
    });

    if (sortBy === "price_asc") filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") filtered.sort((a, b) => b.price - a.price);
    else if (sortBy === "rating") filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sortBy === "discount") filtered.sort((a, b) => {
        const da = a.original_price ? (1 - a.price / a.original_price) : 0;
        const db = b.original_price ? (1 - b.price / b.original_price) : 0;
        return db - da;
    });
    else filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    const featuredProducts = products.filter(p => p.is_featured);
    const slide = HERO_SLIDES[bannerIdx];

    const isSearching = searchQuery || categoryFilter;

    return (
        <div className="min-h-screen bg-background">
            <Navbar cartCount={cartCount} onVoiceSearch={startVoiceSearch} listening={listening} />

            {!isSearching && (
                <>
                    {/* HERO SLIDER */}
                    <div className={`relative bg-gradient-to-r ${slide.bg} overflow-hidden h-64 sm:h-96 transition-all duration-500`}>
                        <div className="absolute inset-0 flex items-center px-6 sm:px-20 z-10">
                            <div className="text-white max-w-lg">
                                <span className={`inline-block text-xs font-bold tracking-widest px-2 py-0.5 rounded mb-3 border border-current ${slide.color}`}>{slide.badge}</span>
                                <h2 className="text-3xl sm:text-5xl font-extrabold mb-2 leading-tight">{slide.headline}</h2>
                                <p className="text-sm sm:text-lg opacity-80 mb-4">{slide.sub}</p>
                                <Button onClick={() => navigate(slide.link)} className="bg-orange-400 hover:bg-orange-500 text-white font-bold text-sm px-6 py-2 rounded-full shadow-lg">
                                    {slide.cta} <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                        <img src={slide.img} alt="" className="absolute right-0 top-0 h-full w-1/2 sm:w-2/5 object-cover opacity-20 sm:opacity-40 pointer-events-none" />
                        {/* Dots */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                            {HERO_SLIDES.map((_, i) => (
                                <button key={i} onClick={() => { setBannerIdx(i); clearInterval(heroTimerRef.current); }}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === bannerIdx ? "bg-orange-400 w-6" : "bg-white/40 w-2"}`} />
                            ))}
                        </div>
                        {/* Arrows */}
                        <button onClick={() => setBannerIdx(i => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 z-10 transition-colors">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button onClick={() => setBannerIdx(i => (i + 1) % HERO_SLIDES.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 z-10 transition-colors">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    {/* CATEGORY GRID */}
                    <div className="max-w-7xl mx-auto px-4 py-6">
                        <h2 className="text-lg font-bold mb-3">Shop by Category</h2>
                        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-3">
                            {CATEGORIES.map(cat => (
                                <button key={cat.name} onClick={() => navigate(`/?category=${encodeURIComponent(cat.name)}`)}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border ${cat.color} hover:scale-105 transition-transform duration-200 cursor-pointer`}>
                                    <span className="text-2xl">{cat.emoji}</span>
                                    <span className="text-xs font-medium text-center leading-tight">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* DEAL STRIP */}
                    <div className="max-w-7xl mx-auto px-4 pb-4">
                        <div className="bg-gradient-to-r from-orange-400 to-amber-400 rounded-2xl p-4 flex items-center justify-between overflow-x-auto gap-4 scrollbar-none">
                            <div className="text-white flex-shrink-0">
                                <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">Today's</p>
                                <p className="text-xl font-extrabold">Top Deals</p>
                            </div>
                            <div className="flex gap-3 flex-shrink-0">
                                {DEALS.map(d => (
                                    <button key={d.label} onClick={() => navigate(`/?category=${encodeURIComponent(d.category)}`)}
                                        className="bg-white/20 hover:bg-white/30 text-white rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5">
                                        {d.icon} {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* FEATURED PRODUCTS */}
                    {featuredProducts.length > 0 && (
                        <div className="max-w-7xl mx-auto px-4 pb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-bold">⭐ Featured Products</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {featuredProducts.slice(0, 10).map(p => <ProductCard key={p.id} product={p} onAddToCart={addToCart} />)}
                            </div>
                        </div>
                    )}

                    {/* PROMO BANNERS */}
                    <div className="max-w-7xl mx-auto px-4 pb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { bg: "from-purple-600 to-indigo-600", title: "Beauty & Skincare", sub: "Glow up deals", emoji: "💄", cat: "Beauty" },
                            { bg: "from-green-600 to-teal-600", title: "Sports & Fitness", sub: "Train harder", emoji: "💪", cat: "Sports" },
                            { bg: "from-yellow-500 to-orange-500", title: "Books & Learning", sub: "Expand your mind", emoji: "📖", cat: "Books" },
                        ].map(b => (
                            <button key={b.cat} onClick={() => navigate(`/?category=${encodeURIComponent(b.cat)}`)}
                                className={`bg-gradient-to-br ${b.bg} rounded-2xl p-5 text-white text-left hover:scale-[1.02] transition-transform`}>
                                <p className="text-3xl mb-2">{b.emoji}</p>
                                <p className="font-bold text-lg">{b.title}</p>
                                <p className="text-sm opacity-80">{b.sub}</p>
                                <p className="text-xs mt-2 flex items-center gap-1 opacity-90 font-medium">Shop Now <ChevronRight className="h-3 w-3" /></p>
                            </button>
                        ))}
                    </div>

                    {/* ALL PRODUCTS */}
                    <div className="max-w-7xl mx-auto px-4 pb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">All Products</h2>
                            <div className="flex items-center gap-2">
                                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                                    className="border border-border rounded-md px-2 py-1.5 text-xs sm:text-sm bg-card">
                                    <option value="newest">Newest</option>
                                    <option value="price_asc">Price: Low–High</option>
                                    <option value="price_desc">Price: High–Low</option>
                                    <option value="rating">Top Rated</option>
                                    <option value="discount">Best Discount</option>
                                </select>
                                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1 text-xs sm:text-sm">
                                    <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                                </Button>
                            </div>
                        </div>

                        {showFilters && (
                            <div className="bg-card border border-border rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
                                        Price: ₹{filters.minPrice.toLocaleString()} – ₹{filters.maxPrice.toLocaleString()}
                                    </label>
                                    <Slider min={0} max={200000} step={500} value={[filters.minPrice, filters.maxPrice]}
                                        onValueChange={([min, max]) => setFilters(f => ({ ...f, minPrice: min, maxPrice: max }))} />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Min Rating</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {[0, 3, 4, 4.5].map(r => (
                                            <button key={r} onClick={() => setFilters(f => ({ ...f, minRating: r }))}
                                                className={`px-3 py-1.5 rounded-full text-xs border font-medium transition-colors flex items-center gap-1 ${filters.minRating === r ? "bg-orange-400 text-white border-orange-400" : "border-border hover:border-orange-300"}`}>
                                                {r === 0 ? "All" : <><Star className="h-3 w-3 fill-current" />{r}+</>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-orange-400" /></div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-5xl mb-4">🔍</p>
                                <p className="text-xl font-semibold mb-2">No products found</p>
                                <p className="text-muted-foreground">Try adjusting your filters</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                                {filtered.map(p => <ProductCard key={p.id} product={p} onAddToCart={addToCart} />)}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* SEARCH / CATEGORY RESULTS */}
            {isSearching && (
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold">
                                {searchQuery ? `Results for "${searchQuery}"` : categoryFilter}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex gap-2 flex-wrap">
                                {categoryFilter && (
                                    <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => navigate("/")}>
                                        {categoryFilter} <X className="h-3 w-3" />
                                    </Badge>
                                )}
                                {searchQuery && (
                                    <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => navigate("/")}>
                                        "{searchQuery}" <X className="h-3 w-3" />
                                    </Badge>
                                )}
                            </div>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                                className="border border-border rounded-md px-2 py-1.5 text-xs sm:text-sm bg-card">
                                <option value="newest">Newest</option>
                                <option value="price_asc">Price: Low–High</option>
                                <option value="price_desc">Price: High–Low</option>
                                <option value="rating">Top Rated</option>
                                <option value="discount">Best Discount</option>
                            </select>
                            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1 text-xs sm:text-sm">
                                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                            </Button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="bg-card border border-border rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
                                    Price: ₹{filters.minPrice.toLocaleString()} – ₹{filters.maxPrice.toLocaleString()}
                                </label>
                                <Slider min={0} max={200000} step={500} value={[filters.minPrice, filters.maxPrice]}
                                    onValueChange={([min, max]) => setFilters(f => ({ ...f, minPrice: min, maxPrice: max }))} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Min Rating</label>
                                <div className="flex gap-2 flex-wrap">
                                    {[0, 3, 4, 4.5].map(r => (
                                        <button key={r} onClick={() => setFilters(f => ({ ...f, minRating: r }))}
                                            className={`px-3 py-1.5 rounded-full text-xs border font-medium transition-colors flex items-center gap-1 ${filters.minRating === r ? "bg-orange-400 text-white border-orange-400" : "border-border hover:border-orange-300"}`}>
                                            {r === 0 ? "All" : <><Star className="h-3 w-3 fill-current" />{r}+</>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-orange-400" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-5xl mb-4">🔍</p>
                            <p className="text-xl font-semibold mb-2">No products found</p>
                            <p className="text-muted-foreground">Try different keywords</p>
                            <Button onClick={() => navigate("/")} variant="outline" className="mt-4">Back to Home</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                            {filtered.map(p => <ProductCard key={p.id} product={p} onAddToCart={addToCart} />)}
                        </div>
                    )}
                </div>
            )}

            {/* FOOTER */}
            <footer className="bg-[#131921] text-white mt-12">
                <div className="bg-[#232f3e] py-4 text-center text-sm hover:bg-[#37475a] transition-colors cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                    Back to top
                </div>
                <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
                    {[
                        { 
                            title: "Get to Know Us", 
                            links: [
                                {name: "About OmniShop", path:"/p/about"}, 
                                {name: "Careers", path:"/p/careers"}, 
                                {name: "Press Releases", path:"/p/press"}, 
                                {name: "OmniShop Science", path:"/p/science"},
                                {name: "Sustainability", path:"/p/sustainability"}
                            ] 
                        },
                        { 
                            title: "Connect with Us", 
                            links: [
                                {name: "Facebook", path:"https://facebook.com"}, 
                                {name: "Twitter", path:"https://twitter.com"},
                                {name: "Instagram", path:"https://instagram.com"}
                            ] 
                        },
                        { 
                            title: "Make Money with Us", 
                            links: [
                                {name: "Sell on OmniShop", path:"/seller/apply"}, 
                                {name: "Sell under OmniShop Accelerator", path:"/seller/apply"},
                                {name: "Become an Affiliate", path:"/p/affiliate"},
                                {name: "Fulfilment by OmniShop", path:"/p/fbs"},
                                {name: "Advertise Your Products", path:"/p/advertise"}
                            ] 
                        },
                        { 
                            title: "Let Us Help You", 
                            links: [
                                {name: "Your Account", path:"/settings"}, 
                                {name: "Returns Centre", path:"/p/returns"}, 
                                {name: "100% Purchase Protection", path:"/p/protection"},
                                {name: "Track Orders", path:"/orders"}, 
                                {name: "Help & Support", path:"/p/contact"}
                            ] 
                        }
                    ].map(col => (
                        <div key={col.title}>
                            <p className="font-bold mb-4 text-base text-white">{col.title}</p>
                            <ul className="space-y-2">
                                {col.links.map(l => (
                                    <li key={l.name}>
                                        <Link to={l.path} className="text-gray-300 hover:underline transition-all">
                                            {l.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="border-t border-gray-700 py-8">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <h1 className="text-2xl font-bold">Shop<span className="text-orange-400">Zone</span></h1>
                        <div className="flex gap-4 text-xs text-gray-400">
                            <span>Australia</span><span>Brazil</span><span>Canada</span><span>China</span><span>France</span><span>Germany</span><span>Italy</span><span>Japan</span><span>Mexico</span><span>Netherlands</span><span>Poland</span><span>Singapore</span><span>Spain</span><span>Turkey</span><span>United Arab Emirates</span><span>United Kingdom</span><span>United States</span>
                        </div>
                    </div>
                </div>
                <div className="bg-[#131921] py-8 text-center border-t border-gray-800">
                    <div className="flex justify-center gap-6 text-xs text-gray-300 mb-2">
                        <Link to="/p/conditions" className="hover:underline">Conditions of Use & Sale</Link>
                        <Link to="/p/privacy" className="hover:underline">Privacy Notice</Link>
                        <Link to="/p/ads" className="hover:underline">Interest-Based Ads</Link>
                    </div>
                    <p className="text-gray-400 text-[10px]">
                        © 2026 OmniShop. All rights reserved. Made with care in India.
                    </p>
                </div>
            </footer>
        </div>
    );
}