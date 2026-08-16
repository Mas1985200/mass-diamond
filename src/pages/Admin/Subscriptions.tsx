import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LoadingState, EmptyState } from "@/components/States";

interface Row {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
  created_at: string;
}

// Read-only view over `subscriptions`. Rows are written by a real
// payment-provider webhook (server-side), never simulated here —
// per spec section 34, no fake payment success is ever created.
export default function AdminSubscriptions() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("id, user_id, plan, status, current_period_end, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      setRows((data ?? []) as Row[]);
    })();
  }, []);

  if (!rows) return <LoadingState />;
  if (rows.length === 0)
    return (
      <EmptyState label="No subscriptions yet. This table is populated by a payment-provider webhook once one is configured (see README §7)." />
    );

  return (
    <div className="md-panel overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-text-muted text-xs uppercase border-b border-border">
          <tr>
            <th className="text-left px-4 py-3">Plan</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-left px-4 py-3">Renews</th>
            <th className="text-left px-4 py-3">Since</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/50">
              <td className="px-4 py-2.5">{r.plan}</td>
              <td className="px-4 py-2.5">{r.status}</td>
              <td className="px-4 py-2.5">{r.current_period_end ? new Date(r.current_period_end).toLocaleDateString() : "—"}</td>
              <td className="px-4 py-2.5 text-text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
