import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

export default function PaymentCancel() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <XCircle className="h-20 w-20 text-red-500 mb-4" />
                <h1 className="text-3xl font-bold mb-2">Payment Cancelled</h1>
                <p className="text-muted-foreground mb-6 max-w-md">Your payment was cancelled. No charges were made.</p>
                <div className="flex gap-3">
                    <Button onClick={() => navigate("/checkout")} className="bg-orange-400 hover:bg-orange-500 text-white">Try Again</Button>
                    <Button onClick={() => navigate("/cart")} variant="outline">Back to Cart</Button>
                </div>
            </div>
        </div>
    );
}