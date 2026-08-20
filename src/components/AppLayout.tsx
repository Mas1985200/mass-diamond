import { Outlet, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/States";
import { isRtl } from "@/lib/i18n";

// Wraps every authenticated route: enforces sign-in, applies the
// sidebar shell, and keeps document dir in sync with the
// active language for correct RTL/LTR rendering (spec section 10).
export default function AppLayout() {
  const { user, loading, configured } = useAuth();
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = isRtl(i18n.language) ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  if (configured && loading) return <LoadingState label="Loading Mass Diamond..." />;
  if (configured && !user) return <Navigate to="/landing" replace />;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
