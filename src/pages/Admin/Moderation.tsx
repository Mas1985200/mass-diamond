import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { EmptyState, LoadingState } from "@/components/States";

interface PendingItem {
  id: string;
  title: string;
  table: "marketplace_listings" | "properties" | "businesses";
}

// Only admins can move status -> 'published' (enforced by the
// enforce_listing_review() trigger server-side, see migrations 0003/0004).
// This UI simply calls the same update the trigger permits.
export default function AdminModeration() {
  const [items, setItems] = useState<PendingItem[] | null>(null);

  async function load() {
    const [{ data: listings }, { data: properties }, { data: businesses }] = await Promise.all([
      supabase.from("marketplace_listings").select("id, title").eq("status", "pending_review"),
      supabase.from("properties").select("id, title").eq("status", "pending_review"),
      supabase.from("businesses").select("id, name").eq("status", "pending_review")
    ]);

    setItems([
      ...(listings ?? []).map((l) => ({ id: l.id, title: l.title, table: "marketplace_listings" as const })),
      ...(properties ?? []).map((p) => ({ id: p.id, title: p.title, table: "properties" as const })),
      ...(businesses ?? []).map((b) => ({ id: b.id, title: b.name, table: "businesses" as const }))
    ]);
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(item: PendingItem, approve: boolean) {
    await supabase
      .from(item.table)
      .update({ status: approve ? "published" : "rejected" })
      .eq("id", item.id);
    setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? null);
  }

  if (items === null) return <LoadingState />;
  if (items.length === 0) return <EmptyState label="Nothing pending review." />;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={`${item.table}-${item.id}`} className="md-panel p-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{item.title}</p>
            <p className="text-xs text-text-muted">{item.table.replace("_", " ")}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => decide(item, true)} className="md-btn-primary text-xs px-3 py-1.5">Approve</button>
            <button onClick={() => decide(item, false)} className="md-btn-ghost text-xs px-3 py-1.5">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
