import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { updateUserProfile } from "@/services/firestoreService";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { Loader2, User, MapPin, Phone, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Profile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({ phone: "" });
    const [addr, setAddr] = useState({ name: "", phone: "", address: "", city: "", state: "", pincode: "" });

    useEffect(() => {
        if (!user) { navigate("/sign-in"); return; }
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            setProfile({ phone: user.phone || "" });
            if (user.shipping_address) setAddr(user.shipping_address);
            else setAddr(a => ({ ...a, name: user.full_name || "", phone: user.phone || "" }));
        } catch (error) {
            console.error("Failed to load profile:", error);
            toast.error("Failed to load profile");
        }
        setLoading(false);
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            await updateUserProfile(user.uid, {
                phone: profile.phone.slice(0, 15),
                shipping_address: {
                    name: addr.name.slice(0, 100),
                    phone: addr.phone.slice(0, 15),
                    address: addr.address.slice(0, 500),
                    city: addr.city.slice(0, 100),
                    state: addr.state.slice(0, 100),
                    pincode: addr.pincode.slice(0, 6)
                }
            });
            toast.success("Profile updated!");
        } catch (error) {
            console.error("Failed to save profile:", error);
            toast.error("Failed to save profile");
        }
        setSaving(false);
    };

    if (loading) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-orange-400" /></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">My Profile</h1>

                {/* Account Info */}
                <div className="bg-card border border-border rounded-xl p-5 mb-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="font-bold">{user.full_name || "User"}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                    <div>
                        <Label className="flex items-center gap-1 mb-1"><Phone className="h-3 w-3" /> Phone Number</Label>
                        <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 15) }))} placeholder="10-digit mobile number" />
                    </div>
                </div>

                {/* Address */}
                <div className="bg-card border border-border rounded-xl p-5 mb-6">
                    <h2 className="font-bold flex items-center gap-2 mb-4">
                        <MapPin className="h-4 w-4 text-orange-500" /> Default Delivery Address
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2"><Label>Full Name</Label><Input value={addr.name} onChange={e => setAddr(a => ({ ...a, name: e.target.value.slice(0, 100) }))} placeholder="Receiver's full name" /></div>
                        <div className="col-span-2"><Label>Phone</Label><Input value={addr.phone} onChange={e => setAddr(a => ({ ...a, phone: e.target.value.replace(/\D/g, "").slice(0, 15) }))} placeholder="Mobile number" /></div>
                        <div className="col-span-2"><Label>Address</Label><Input value={addr.address} onChange={e => setAddr(a => ({ ...a, address: e.target.value.slice(0, 500) }))} placeholder="House no, Street, Locality" /></div>
                        <div><Label>City</Label><Input value={addr.city} onChange={e => setAddr(a => ({ ...a, city: e.target.value.slice(0, 100) }))} placeholder="City" /></div>
                        <div><Label>State</Label><Input value={addr.state} onChange={e => setAddr(a => ({ ...a, state: e.target.value.slice(0, 100) }))} placeholder="State" /></div>
                        <div><Label>Pincode</Label><Input value={addr.pincode} onChange={e => setAddr(a => ({ ...a, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="6-digit PIN" /></div>
                    </div>
                </div>

                <Button onClick={saveProfile} disabled={saving} className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Profile
                </Button>
            </div>
        </div>
    );
}
