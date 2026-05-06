import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingCart, Search, User, LogOut, ChevronDown, Mic } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/lib/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const CATEGORIES = ["Electronics", "Clothing", "Books", "Home & Kitchen", "Sports", "Beauty", "Toys", "Automotive", "Grocery"];

export default function Navbar({ cartCount = 0, onVoiceSearch = null, listening = false }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const catRef = useRef(null);
    const touchStartX = useRef(null);

    useEffect(() => {
        setSearch(searchParams.get("search") || "");
    }, [searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim().slice(0, 200))}`);
        else navigate("/");
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/sign-in");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchMove = (e) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.touches[0].clientX;
        if (catRef.current) catRef.current.scrollLeft += diff * 0.8;
        touchStartX.current = e.touches[0].clientX;
    };
    const onTouchEnd = () => { touchStartX.current = null; };

    return (
        <header className="sticky top-0 z-50 shadow-md">
            {/* Top bar */}
            <div className="bg-[#131921] text-white px-3 py-2.5 flex items-center gap-3">
                <Link to="/" className="flex-shrink-0">
                    <div className="text-2xl sm:text-2xl font-bold text-white tracking-tight">Shop<span className="text-orange-400">Zone</span></div>
                </Link>

                <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-auto">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search products..."
                        className="bg-white text-black rounded-r-none border-0 h-9 text-sm focus-visible:ring-0 placeholder:text-gray-500" />

                    <button type="submit" className="bg-orange-400 hover:bg-orange-500 px-3 rounded-r-md transition-colors flex-shrink-0">
                        <Search className="h-4 w-4 text-[#131921]" />
                    </button>
                    {onVoiceSearch &&
                        <button type="button" onClick={onVoiceSearch}
                            className={`ml-1 px-2 rounded-md transition-colors flex-shrink-0 ${listening ? 'bg-red-500 animate-pulse' : 'bg-white/10 hover:bg-white/20'}`}>
                            <Mic className={`h-4 w-4 ${listening ? 'text-white' : 'text-white/70'}`} />
                        </button>
                    }
                </form>

                <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                    {user && <NotificationBell userEmail={user.email} />}
                    {user ?
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="text-white hover:bg-white/10 text-xs sm:text-sm gap-1 px-2 h-11 sm:h-9 min-w-[44px]">
                                    <User className="h-5 w-5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline max-w-20 truncate">{user.full_name?.split(" ")[0] || "Account"}</span>
                                    <ChevronDown className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <div className="px-3 py-2 border-b border-border">
                                    <p className="font-medium text-sm truncate">{user.full_name || user.email}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                                <DropdownMenuItem asChild><Link to="/orders">My Orders</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link to="/settings">⚙️ Account Settings</Link></DropdownMenuItem>
                                {user.role === "seller" && <DropdownMenuItem asChild><Link to="/seller/dashboard">🏪 Seller Dashboard</Link></DropdownMenuItem>}
                                {user.role === "delivery_boy" && <DropdownMenuItem asChild><Link to="/delivery">🚚 Delivery Dashboard</Link></DropdownMenuItem>}
                                {user.role === "admin" &&
                                    <DropdownMenuItem asChild><Link to="/admin">Admin Panel</Link></DropdownMenuItem>
                                }
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu> :

                        <Button asChild variant="ghost" className="text-white hover:bg-white/10 text-sm h-11 sm:h-9 px-3 min-w-[44px]">
                            <Link to="/sign-in">Sign In</Link>
                        </Button>
                    }

                    <Link to="/cart" className="relative p-2 hover:bg-white/10 rounded-md transition-colors">
                        <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        {cartCount > 0 &&
                            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-orange-400 text-[#131921] text-xs font-bold border-0 min-w-0">
                                {cartCount > 9 ? "9+" : cartCount}
                            </Badge>
                        }
                    </Link>
                </div>
            </div>

            {/* Category bar — swipeable on mobile */}
            <nav
                ref={catRef}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                className="bg-[#232f3e] text-white px-4 py-1.5 flex items-center gap-5 overflow-x-auto select-none scrollbar-none"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>

                <Link to="/" className="whitespace-nowrap text-sm hover:text-orange-300 transition-colors font-medium flex-shrink-0">All</Link>
                {CATEGORIES.map((cat) =>
                    <Link
                        key={cat}
                        to={`/?category=${encodeURIComponent(cat)}`}
                        className="whitespace-nowrap text-sm hover:text-orange-300 transition-colors flex-shrink-0">

                        {cat}
                    </Link>
                )}
            </nav>

            {/* Mobile Search Bar - Visible only on small screens */}
            <div className="bg-[#131921] px-3 pb-3 md:hidden">
                <form onSubmit={handleSearch} className="flex w-full">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search products..."
                        className="bg-white text-black rounded-r-none border-0 h-10 text-sm focus-visible:ring-0 placeholder:text-gray-500" />

                    <button type="submit" className="bg-orange-400 hover:bg-orange-500 px-4 rounded-r-md transition-colors flex-shrink-0">
                        <Search className="h-5 w-5 text-[#131921]" />
                    </button>
                    {onVoiceSearch &&
                        <button type="button" onClick={onVoiceSearch}
                            className={`ml-2 px-3 rounded-md transition-colors flex-shrink-0 ${listening ? 'bg-red-500 animate-pulse' : 'bg-white/10'}`}>
                            <Mic className={`h-5 w-5 ${listening ? 'text-white' : 'text-white/70'}`} />
                        </button>
                    }
                </form>
            </div>
        </header>
    );
}