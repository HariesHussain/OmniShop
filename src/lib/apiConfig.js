export const getApiBase = () => {
    const env = import.meta['env'] || {};
    if (env.VITE_API_URL) return String(env.VITE_API_URL).replace(/\/+$/, "");
    if (env.DEV) {
        const hostname = window.location.hostname;
        return `http://${hostname}:5000`;
    }
    throw new Error("VITE_API_URL is required in production");
};
