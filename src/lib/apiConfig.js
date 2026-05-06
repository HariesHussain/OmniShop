export const getApiBase = () => {
    const env = import.meta['env'] || {};
    
    // 1. Explicit override via environment variable
    if (env.VITE_API_URL) return String(env.VITE_API_URL).replace(/\/+$/, "");
    
    // 2. Local development fallback (Vite dev server usually at 5173, Backend at 5000)
    if (env.DEV) {
        const hostname = window.location.hostname;
        return `http://${hostname}:5000`;
    }
    
    // 3. Production same-origin fallback
    // In Vercel, the site origin acts as the base, and /api/... routes are handled by vercel.json rewrites.
    // Note: We return only the origin because existing fetch calls append "/api/..."
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    return "";
};
