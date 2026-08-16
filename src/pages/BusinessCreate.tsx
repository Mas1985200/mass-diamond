import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

// Spec section 24/25: business owner submits profile; admin verifies
// before it's publicly searchable. Not automatically verified.
export default function BusinessCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", description: "", address: "", city: "", country: "", phone: "", website: "" });
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (!user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("businesses")
        .insert({ ...form, owner_id: user.id, status: "pending_review", verification_status: "pending" })
        .select("id")
        .single();
      if (error) throw error;
      navigate(`/businesses/${data.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return <div className="p-6 text-text-muted">Sign in to add a business.</div>;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
      <h1 className="text-xl font-semibold mb-1">Add your business</h1>
      <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Business name" className="md-input w-full" />
      <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Description" className="md-input w-full" rows={3} />
      <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Address" className="md-input w-full" />
      <div className="grid grid-cols-2 gap-2">
        <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" className="md-input" />
        <input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Country" className="md-input" />
      </div>
      <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone (private, for verification only)" className="md-input w-full" />
      <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="Website (optional)" className="md-input w-full" />
      <button onClick={submit} disabled={submitting} className="md-btn-primary w-full disabled:opacity-50">
        {submitting ? "Submitting..." : "Submit for verification"}
      </button>
    </div>
  );
}
