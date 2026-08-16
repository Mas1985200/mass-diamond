import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LoadingState, EmptyState } from "@/components/States";

interface Row {
  id: string;
  business_id: string;
  rating: number;
  text: string | null;
  is_hidden: boolean;
  created_at: string;
}

export default function AdminReviews() {
  const [rows, setRows] = useState<Row[] | null>(null);

  async function load() {
    const { data } = await supabase
      .from("business_reviews")
      .select("id, business_id, rating, text, is_hidden, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data ?? []) as Row[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleHidden(row: Row) {
    await supabase.from("business_reviews").update({ is_hidden: !row.is_hidden }).eq("id", row.id);
    setRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, is_hidden: !r.is_hidden } : r)) ?? null);
  }

  async function remove(row: Row) {
    await supabase.from("business_reviews").delete().eq("id", row.id);
    setRows((prev) => prev?.filter((r) => r.id !== row.id) ?? null);
  }

  if (!rows) return <LoadingState />;
  if (rows.length === 0) return <EmptyState label="No reviews yet." />;

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="md-panel p-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
            {r.text && <p className="text-sm mt-1">{r.text}</p>}
            {r.is_hidden && <p className="text-xs text-primary mt-1">Hidden</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => toggleHidden(r)} className="md-btn-ghost text-xs px-3 py-1.5">
              {r.is_hidden ? "Unhide" : "Hide"}
            </button>
            <button onClick={() => remove(r)} className="md-btn-ghost text-xs px-3 py-1.5">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
