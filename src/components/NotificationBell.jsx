import { useState, useEffect, useRef } from "react";
import { Bell, X, Package, Tag, Info, ShoppingBag } from "lucide-react";
import { getNotifications, getBroadcastNotifications, updateNotification } from "@/services/firestoreService";
import { Badge } from "@/components/ui/badge";

const TYPE_ICON = {
    offer: Tag,
    order: Package,
    promo: ShoppingBag,
    system: Info,
};

const TYPE_COLOR = {
    offer: "text-orange-500 bg-orange-50",
    order: "text-blue-500 bg-blue-50",
    promo: "text-green-500 bg-green-50",
    system: "text-gray-500 bg-gray-50",
};

const DISMISSED_KEY = (email) => `sz_notif_dismissed_${email}`;

export default function NotificationBell({ userEmail }) {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [dismissed, setDismissed] = useState(() => {
        try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY(userEmail)) || "[]")) } catch { return new Set(); }
    });
    const ref = useRef(null);

    useEffect(() => {
        if (userEmail) loadNotifications();
    }, [userEmail]);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const loadNotifications = async () => {
        try {
            const [personal, broadcast] = await Promise.all([
                getNotifications(userEmail),
                getBroadcastNotifications(),
            ]);
            const all = [...personal, ...broadcast].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
            // Deduplicate by id
            const seen = new Set();
            setNotifications(all.filter(n => { if (seen.has(n.id)) return false; seen.add(n.id); return true; }));
        } catch (error) {
            console.error("Failed to load notifications:", error);
        }
    };

    const saveDismissed = (newSet) => {
        try { localStorage.setItem(DISMISSED_KEY(userEmail), JSON.stringify([...newSet])); } catch { }
        setDismissed(newSet);
    };

    const markRead = async (n) => {
        if (n.is_broadcast) {
            const next = new Set(dismissed); next.add(n.id); saveDismissed(next);
        } else if (!n.is_read) {
            try {
                await updateNotification(n.id, { is_read: true });
                setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
            } catch (error) {
                console.error("Failed to mark notification as read:", error);
            }
        }
    };

    const markAllRead = async () => {
        try {
            const personal = notifications.filter(n => !n.is_broadcast && !n.is_read);
            const broadcast = notifications.filter(n => n.is_broadcast && !dismissed.has(n.id));
            await Promise.all(personal.map(n => updateNotification(n.id, { is_read: true })));
            const next = new Set(dismissed); broadcast.forEach(n => next.add(n.id)); saveDismissed(next);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const isRead = (n) => n.is_broadcast ? dismissed.has(n.id) : n.is_read;
    const unreadCount = notifications.filter(n => !isRead(n)).length;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => { setOpen(!open); if (!open) loadNotifications(); }}
                className="relative p-2 hover:bg-white/10 rounded-md transition-colors"
            >
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-xs font-bold border-0 min-w-0">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h3 className="font-bold text-sm">Notifications</h3>
                        <div className="flex gap-2">
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="text-xs text-orange-500 hover:underline">Mark all read</button>
                            )}
                            <button onClick={() => setOpen(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto divide-y divide-border">
                        {notifications.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground text-sm">
                                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                No notifications yet
                            </div>
                        ) : notifications.map(n => {
                            const Icon = TYPE_ICON[n.type] || Info;
                            const colorClass = TYPE_COLOR[n.type] || TYPE_COLOR.system;
                            return (
                                <div
                                    key={n.id}
                                    onClick={() => markRead(n)}
                                    className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${!isRead(n) ? "bg-orange-50/50" : ""}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${!isRead(n) ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_date).toLocaleDateString()}</p>
                                    </div>
                                    {!isRead(n) && <div className="w-2 h-2 bg-orange-400 rounded-full mt-1 flex-shrink-0" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}