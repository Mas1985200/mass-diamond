import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LoadingState } from "@/components/States";

interface Row {
  id: string;
  display_name: string | null;
  country: string | null;
  city: string | null;
  created_at: string;
}

export default function AdminUsers() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, country, city, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      setRows((data ?? []) as Row[]);
    })();
  }, []);

  if (!rows) return <LoadingState />;

  return (
    <div className="md-panel overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-text-muted text-xs uppercase border-b border-border">
          <tr>
            <th className="text-left px-4 py-3">Name</th>
            <th className="text-left px-4 py-3">Location</th>
            <th className="text-left px-4 py-3">Joined</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/50">
              <td className="px-4 py-2.5">{r.display_name ?? "—"}</td>
              <td className="px-4 py-2.5">{[r.city, r.country].filter(Boolean).join(", ") || "—"}</td>
              <td className="px-4 py-2.5 text-text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
