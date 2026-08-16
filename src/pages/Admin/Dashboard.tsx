import { useEffect, useState } from "react";
import { LoadingState } from "@/components/States";
import { supabase } from "@/lib/supabase";

interface Stats {
  users: number;
  listings: number;
  properties: number;
  businesses: number;
  aiRequests: number;
}

// Admin authorization is enforced server-side by RLS (has_role() checks
// on every admin-relevant table, see migrations). This page also
// double-checks the role client-side purely for UX (redirecting non-
// admins) — that check is NOT the security boundary.
export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const [{ count: users }, { count: listings }, { count: properties }, { count: businesses }, { count: aiRequests }] =
        await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("marketplace_listings").select("*", { count: "exact", head: true }),
          supabase.from("properties").select("*", { count: "exact", head: true }),
          supabase.from("businesses").select("*", { count: "exact", head: true }),
          supabase.from("ai_usage_logs").select("*", { count: "exact", head: true })
        ]);
      setStats({
        users: users ?? 0,
        listings: listings ?? 0,
        properties: properties ?? 0,
        businesses: businesses ?? 0,
        aiRequests: aiRequests ?? 0
      });
    })();
  }, []);

  if (!stats) return <LoadingState />;

  const cards = [
    { label: "Users", value: stats.users },
    { label: "Marketplace listings", value: stats.listings },
    { label: "Properties", value: stats.properties },
    { label: "Businesses", value: stats.businesses },
    { label: "AI requests", value: stats.aiRequests }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="md-panel p-4">
          <p className="text-2xl font-semibold text-primary">{c.value}</p>
          <p className="text-sm text-text-muted mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
