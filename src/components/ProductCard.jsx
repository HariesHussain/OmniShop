import { Link } from "react-router-dom";
import { Star, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ProductCard({ product, onAddToCart }) {
    const discount = product.original_price && product.original_price > product.price
        ? Math.round((1 - product.price / product.original_price) * 100)
        : null;

    return (
        <div className="bg-card rounded-lg border border-border hover:shadow-lg transition-all duration-200 overflow-hidden group flex flex-col">
            <Link to={`/product/${product.id}`} className="block overflow-hidden bg-gray-50 aspect-square">
                <img
                    src={product.images?.[0] || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80"}
                    alt={product.title}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                />
            </Link>

            <div className="p-3 flex flex-col flex-1">
                <Link to={`/product/${product.id}`}>
                    <h3 className="font-medium text-sm text-foreground line-clamp-2 hover:text-orange-500 transition-colors mb-1">
                        {product.title}
                    </h3>
                </Link>

                {product.brand && <p className="text-xs text-muted-foreground mb-1">by {product.brand}</p>}

                <div className="flex items-center gap-1 mb-2">
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`h-3 w-3 ${s <= Math.round(product.rating || 0) ? "fill-orange-400 text-orange-400" : "text-gray-300"}`} />
                        ))}
                    </div>
                    <span className="text-xs text-muted-foreground">({product.review_count || 0})</span>
                </div>

                <div className="flex items-baseline gap-2 mb-1 mt-auto">
                    <span className="text-lg font-bold text-foreground">₹{product.price?.toLocaleString()}</span>
                    {product.original_price && product.original_price > product.price && (
                        <span className="text-xs text-muted-foreground line-through">₹{product.original_price?.toLocaleString()}</span>
                    )}
                    {discount && <Badge className="bg-green-100 text-green-700 text-xs border-0">{discount}% off</Badge>}
                </div>

                <p className="text-[10px] text-green-600 font-medium mb-2">
                    FREE delivery by {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>

                <Button
                    size="sm"
                    onClick={() => onAddToCart?.(product)}
                    className="w-full bg-orange-400 hover:bg-orange-500 text-white font-medium text-xs gap-1"
                >
                    <ShoppingCart className="h-3 w-3" /> Add to Cart
                </Button>
            </div>
        </div>
    );
}