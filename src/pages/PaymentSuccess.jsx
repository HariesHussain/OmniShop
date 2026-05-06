import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/AuthContext";
import { finalizeOrderSecurely } from "@/services/firstOrderVerificationService";
import { toast } from "sonner";

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const processedRef = useRef(false);

    useEffect(() => {
        if (!user) return;
        if (processedRef.current) return;
        processedRef.current = true;

        const finalizeStripeOrder = async () => {
            try {
                const pendingData = localStorage.getItem('pending_order');
                if (!pendingData) {
                    setLoading(false);
                    return;
                }

                const orderInfo = JSON.parse(pendingData);
                
                await finalizeOrderSecurely({
                    ...orderInfo,
                    payment_status: "paid",
                    payment_method: orderInfo.payment_method || "Card",
                });

                // Clear local storage
                localStorage.removeItem('pending_order');
                toast.success("Order confirmed!");

            } catch (error) {
                console.error("Error finalizing payment:", error);
                toast.error("There was an issue saving your order. Please contact support.");
            } finally {
                setLoading(false);
            }
        };

        finalizeStripeOrder();
    }, [user]);

    if (loading) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-orange-400" /></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <CheckCircle className="h-20 w-20 text-green-500 mb-4" />
                <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
                <p className="text-muted-foreground mb-6 max-w-md">Thank you for your purchase. Your payment has been processed and your order is confirmed.</p>
                <div className="flex gap-3">
                    <Button onClick={() => navigate("/orders")} className="bg-orange-400 hover:bg-orange-500 text-white">View My Orders</Button>
                    <Button onClick={() => navigate("/")} variant="outline">Continue Shopping</Button>
                </div>
            </div>
        </div>
    );
}
