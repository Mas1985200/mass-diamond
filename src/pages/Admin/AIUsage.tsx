import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LoadingState, EmptyState } from "@/components/States";

interface Row {
  id: string;
  capability: string | null;
  provider: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
}

// Reads ai_usage_logs, which is written exclusively by the ai-chat
// Edge Function via the service-role key (see 0002_ai_chat.sql) —
// admins can read it, nobody can write it client-side.
export default function AdminAIUsage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ai_usage_logs")
        .select("id, capability, provider, input_tokens, output_tokens, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      setRows((data ?? []) as Row[]);
    })();
  }, []);

  if (!rows) return <LoadingState />;
  if (rows.length === 0) return <EmptyState label="No AI requests logged yet." />;

  const totalIn = rows.reduce((s, r) => s + (r.input_tokens ?? 0), 0);
  const totalOut = rows.reduce((s, r) => s + (r.output_tokens ?? 0), 0);
  const byCapability = rows.reduce<Record<string, number>>((acc, r) => {
    const key = r.capability ?? "UNKNOWN";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="md-panel p-4">
          <p className="text-2xl font-semibold text-primary">{rows.length}</p>
          <p className="text-sm text-text-muted mt-1">Requests (last 100)</p>
        </div>
        <div className="md-panel p-4">
          <p className="text-2xl font-semibold text-primary">{totalIn}</p>
          <p className="text-sm text-text-muted mt-1">Input tokens</p>
        </div>
        <div className="md-panel p-4">
          <p className="text-2xl font-semibold text-primary">{totalOut}</p>
          <p className="text-sm text-text-muted mt-1">Output tokens</p>
        </div>
        <div className="md-panel p-4">
          <p className="text-2xl font-semibold text-primary">{Object.keys(byCapability).length}</p>
          <p className="text-sm text-text-muted mt-1">Capabilities used</p>
        </div>
      </div>

      <div className="md-panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-text-muted text-xs uppercase border-b border-border">
            <tr>
              <th className="text-left px-4 py-3">Capability</th>
              <th className="text-left px-4 py-3">Provider</th>
              <th className="text-left px-4 py-3">Tokens (in/out)</th>
              <th className="text-left px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/50">
                <td className="px-4 py-2.5">{r.capability ?? "—"}</td>
                <td className="px-4 py-2.5">{r.provider ?? "—"}</td>
                <td className="px-4 py-2.5">{r.input_tokens ?? 0} / {r.output_tokens ?? 0}</td>
                <td className="px-4 py-2.5 text-text-muted">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
