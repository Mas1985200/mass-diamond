import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthContext, useAuthState } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ResetPassword from "@/pages/ResetPassword";
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import Marketplace from "@/pages/Marketplace";
import MarketplaceDetail from "@/pages/MarketplaceDetail";
import MarketplaceCreate from "@/pages/MarketplaceCreate";
import RealEstate from "@/pages/RealEstate";
import PropertyDetail from "@/pages/PropertyDetail";
import PropertyCreate from "@/pages/PropertyCreate";
import Businesses from "@/pages/Businesses";
import BusinessDetail from "@/pages/BusinessDetail";
import BusinessCreate from "@/pages/BusinessCreate";
import Messages from "@/pages/Messages";
import Notifications from "@/pages/Notifications";
import ProfilePage from "@/pages/Profile";
import CryptoCheckout from "@/pages/CryptoCheckout";
import AdminLayout from "@/pages/Admin/AdminLayout";
import AdminDashboard from "@/pages/Admin/Dashboard";
import AdminUsers from "@/pages/Admin/Users";
import AdminModeration from "@/pages/Admin/Moderation";
import AdminAIUsage from "@/pages/Admin/AIUsage";
import AdminReviews from "@/pages/Admin/Reviews";
import AdminReports from "@/pages/Admin/Reports";
import AdminSubscriptions from "@/pages/Admin/Subscriptions";
import AdminPayments from "@/pages/Admin/Payments";
import AdminAdvertisements from "@/pages/Admin/Advertisements";
import AdminSettings from "@/pages/Admin/Settings";

export default function App() {
  const auth = useAuthState();

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Authenticated app shell */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/new" element={<MarketplaceCreate />} />
            <Route path="/marketplace/:id" element={<MarketplaceDetail />} />
            <Route path="/real-estate" element={<RealEstate />} />
            <Route path="/real-estate/new" element={<PropertyCreate />} />
            <Route path="/real-estate/:id" element={<PropertyDetail />} />
            <Route path="/businesses" element={<Businesses />} />
            <Route path="/businesses/new" element={<BusinessCreate />} />
            <Route path="/businesses/:id" element={<BusinessDetail />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/checkout/crypto" element={<CryptoCheckout />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="moderation" element={<AdminModeration />} />
            <Route path="ai-usage" element={<AdminAIUsage />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="advertisements" element={<AdminAdvertisements />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
