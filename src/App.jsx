import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SeoManager from '@/components/seo/SeoManager';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import Orders from './pages/Orders';
import SellerDashboard from './pages/seller/Dashboard';
import Profile from './pages/Profile';
import AdminPanel from './pages/admin/AdminPanel';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import Settings from './pages/Settings';
import SellerApply from './pages/seller/Apply';
import DeliveryDashboard from './pages/DeliveryDashboard';
import ResetPassword from './pages/ResetPassword';
import OrderTracking from './pages/OrderTracking';
import StaticPage from './pages/StaticPage';

const AuthenticatedApp = () => {
    const { isLoadingAuth } = useAuth();

    // Show loading spinner while checking auth
    if (isLoadingAuth) {
        return (
            <div className="fixed inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Render the main app
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/success" element={<PaymentSuccess />} />
            <Route path="/cancel" element={<PaymentCancel />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/seller/apply" element={<SellerApply />} />
            <Route path="/delivery" element={<DeliveryDashboard />} />
            <Route path="/order-tracking" element={<OrderTracking />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/p/:pageId" element={<StaticPage />} />
            <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
};


function App() {

    return (
        <HelmetProvider>
            <AuthProvider>
                <QueryClientProvider client={queryClientInstance}>
                    <Router>
                        <SeoManager />
                        <AuthenticatedApp />
                    </Router>
                    <Toaster />
                </QueryClientProvider>
            </AuthProvider>
        </HelmetProvider>
    )
}

export default App
