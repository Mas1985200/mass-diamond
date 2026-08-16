import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LoadingState, EmptyState } from "@/components/States";

interface Row {
  id: string;
  title: string;
  status: string;
  target_country: string | null;
  target_city: string | null;
  budget: number | null;
  created_at: string;
}

export default function AdminAdvertisements() {
  const [rows, setRows] = useState<Row[] | null>(null);

  async function load() {
    const { data } = await supabase
      .from("advertisements")
      .select("id, title, status, target_country, target_city, budget, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data ?? []) as Row[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(row: Row, status: string) {
    await supabase.from("advertisements").update({ status }).eq("id", row.id);
    setRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, status } : r)) ?? null);
  }

  if (!rows) return <LoadingState />;
  if (rows.length === 0) return <EmptyState label="No advertisements submitted yet." />;

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="md-panel p-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{r.title}</p>
            <p className="text-xs text-text-muted mt-1">
              {[r.target_city, r.target_country].filter(Boolean).join(", ") || "All locations"} · budget {r.budget ?? "—"} · {r.status}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setStatus(r, "active")} className="md-btn-primary text-xs px-3 py-1.5">Activate</button>
            <button onClick={() => setStatus(r, "paused")} className="md-btn-ghost text-xs px-3 py-1.5">Pause</button>
            <button onClick={() => setStatus(r, "rejected")} className="md-btn-ghost text-xs px-3 py-1.5">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
