import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/States";
import { Logo } from "@/components/Logo";

const sections = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/moderation", label: "Moderation" },
  { to: "/admin/ai-usage", label: "AI Usage" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/reports", label: "Reports" },
  { to: "/admin/subscriptions", label: "Subscriptions" },
  { to: "/admin/payments", label: "Payments" },
  { to: "/admin/advertisements", label: "Advertisements" },
  { to: "/admin/settings", label: "Settings" }
];

// Client-side redirect for UX only. The actual security boundary is
// server-side RLS via has_role(auth.uid(), 'admin') on every admin
// table — see supabase/migrations/0001_profiles_and_roles.sql.
export default function AdminLayout() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      setIsAdmin((data?.length ?? 0) > 0);
    })();
  }, [user]);

  if (loading || isAdmin === null) return <LoadingState />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:block w-56 border-e border-border bg-panel p-4">
        <div className="flex items-center gap-2 mb-6">
          <Logo size={24} />
          <span className="font-semibold text-sm">Admin</span>
        </div>
        <nav className="space-y-1">
          {sections.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              end={s.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm ${isActive ? "bg-surface text-primary" : "text-text-muted hover:text-text"}`
              }
            >
              {s.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
}
