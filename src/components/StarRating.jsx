import { Star } from "lucide-react";

export default function StarRating({ rating = 0, size = "md", showCount = false, count = 0 }) {
    const sizeMap = {
        sm: { star: "h-3 w-3", container: "gap-0.5" },
        md: { star: "h-4 w-4", container: "gap-1" },
        lg: { star: "h-5 w-5", container: "gap-1.5" },
    };

    const sizeClasses = sizeMap[size] || sizeMap.md;
    const numericRating = Number(rating);
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 >= 0.5;

    return (
        <div className={`flex items-center ${sizeClasses.container}`}>
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`${sizeClasses.star} ${
                            star <= fullStars
                                ? "fill-orange-400 text-orange-400"
                                : star === fullStars + 1 && hasHalfStar
                                ? "fill-orange-400/50 text-orange-400"
                                : "fill-gray-300 text-gray-300"
                        }`}
                    />
                ))}
            </div>
            {showCount && (
                <span className="text-xs sm:text-sm text-gray-600 ml-1">
                    {Number(rating).toFixed(1)} ({count})
                </span>
            )}
        </div>
    );
}
