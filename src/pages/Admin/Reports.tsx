import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LoadingState, EmptyState } from "@/components/States";

interface Row {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
}

// Handles the general-purpose `reports` table (users, listings,
// properties, businesses, reviews, messages — spec section 31) plus a
// link out to the message-specific `message_reports` table.
export default function AdminReports() {
  const [rows, setRows] = useState<Row[] | null>(null);

  async function load() {
    const { data } = await supabase
      .from("reports")
      .select("id, target_type, target_id, reason, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data ?? []) as Row[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(row: Row, status: string) {
    await supabase
      .from("reports")
      .update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null })
      .eq("id", row.id);
    setRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, status } : r)) ?? null);
  }

  if (!rows) return <LoadingState />;
  if (rows.length === 0) return <EmptyState label="No reports." />;

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="md-panel p-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{r.target_type} · {r.status}</p>
            <p className="text-sm text-text-muted mt-1">{r.reason}</p>
            <p className="text-xs text-text-muted mt-1">{new Date(r.created_at).toLocaleString()}</p>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap justify-end">
            <button onClick={() => setStatus(r, "reviewing")} className="md-btn-ghost text-xs px-3 py-1.5">Reviewing</button>
            <button onClick={() => setStatus(r, "resolved")} className="md-btn-primary text-xs px-3 py-1.5">Resolve</button>
            <button onClick={() => setStatus(r, "rejected")} className="md-btn-ghost text-xs px-3 py-1.5">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
