import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LoadingState } from "@/components/States";

interface Method {
  id: string;
  asset: string;
  network: string;
  wallet_address: string;
  instructions: string | null;
  is_active: boolean;
}

// Admin-only management of public crypto wallet addresses (spec §35).
// Private keys are never stored — this table holds public addresses only.
export default function AdminSettings() {
  const [methods, setMethods] = useState<Method[] | null>(null);
  const [form, setForm] = useState({ asset: "", network: "", wallet_address: "", instructions: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from("support_payment_methods").select("*").order("asset");
    setMethods((data ?? []) as Method[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function addMethod() {
    if (!form.asset || !form.network || !form.wallet_address) return;
    setSaving(true);
    try {
      await supabase.from("support_payment_methods").insert({ ...form, is_active: false });
      setForm({ asset: "", network: "", wallet_address: "", instructions: "" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggle(m: Method) {
    await supabase.from("support_payment_methods").update({ is_active: !m.is_active }).eq("id", m.id);
    setMethods((prev) => prev?.map((x) => (x.id === m.id ? { ...x, is_active: !x.is_active } : x)) ?? null);
  }

  async function remove(m: Method) {
    await supabase.from("support_payment_methods").delete().eq("id", m.id);
    setMethods((prev) => prev?.filter((x) => x.id !== m.id) ?? null);
  }

  if (!methods) return <LoadingState />;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-sm font-semibold mb-3">Crypto payment methods (public wallet addresses only)</h2>
        <div className="space-y-2">
          {methods.map((m) => (
            <div key={m.id} className="md-panel p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{m.asset} · {m.network}</p>
                <p className="text-xs text-text-muted truncate">{m.wallet_address}</p>
                {m.is_active && <p className="text-xs text-primary mt-1">Active</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => toggle(m)} className="md-btn-ghost text-xs px-3 py-1.5">
                  {m.is_active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => remove(m)} className="md-btn-ghost text-xs px-3 py-1.5">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="md-panel p-4 space-y-2">
        <p className="text-sm font-medium">Add a payment method</p>
        <div className="grid grid-cols-2 gap-2">
          <input value={form.asset} onChange={(e) => setForm({ ...form, asset: e.target.value })} placeholder="Asset (e.g. USDT)" className="md-input" />
          <input value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} placeholder="Network (e.g. TRC20)" className="md-input" />
        </div>
        <input value={form.wallet_address} onChange={(e) => setForm({ ...form, wallet_address: e.target.value })} placeholder="Public wallet address" className="md-input w-full" />
        <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="Instructions for payers" className="md-input w-full" rows={2} />
        <button onClick={addMethod} disabled={saving} className="md-btn-primary text-sm disabled:opacity-50">
          {saving ? "Saving..." : "Add method"}
        </button>
      </div>
    </div>
  );
}
