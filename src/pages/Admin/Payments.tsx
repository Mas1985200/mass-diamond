import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LoadingState, EmptyState } from "@/components/States";

interface Row {
  id: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  purpose: string | null;
  created_at: string;
}

export default function AdminPayments() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("payments")
        .select("id, amount, currency, provider, status, purpose, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      setRows((data ?? []) as Row[]);
    })();
  }, []);

  if (!rows) return <LoadingState />;
  if (rows.length === 0)
    return <EmptyState label="No payments recorded. Configure PAYMENT_PROVIDER to accept real payments." />;

  const succeeded = rows.filter((r) => r.status === "succeeded").reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="space-y-4">
      <div className="md-panel p-4 w-fit">
        <p className="text-2xl font-semibold text-primary">{succeeded.toFixed(2)}</p>
        <p className="text-sm text-text-muted mt-1">Total succeeded (mixed currencies)</p>
      </div>
      <div className="md-panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-text-muted text-xs uppercase border-b border-border">
            <tr>
              <th className="text-left px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Provider</th>
              <th className="text-left px-4 py-3">Purpose</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/50">
                <td className="px-4 py-2.5">{r.amount} {r.currency}</td>
                <td className="px-4 py-2.5">{r.provider}</td>
                <td className="px-4 py-2.5">{r.purpose ?? "—"}</td>
                <td className="px-4 py-2.5">{r.status}</td>
                <td className="px-4 py-2.5 text-text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
