import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

// Spec section 23: property owner submits basic details + photos;
// listing enters pending_review; admin approves before it's public.
export default function PropertyCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    property_type: "apartment",
    purpose: "rent" as "sale" | "rent",
    title: "",
    description: "",
    price: "",
    rent_period: "month",
    bedrooms: "",
    bathrooms: "",
    area: "",
    city: "",
    country: ""
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (!user) return;
    setSubmitting(true);
    try {
      const { data: property, error } = await supabase
        .from("properties")
        .insert({
          owner_id: user.id,
          property_type: form.property_type,
          purpose: form.purpose,
          title: form.title,
          description: form.description,
          price: form.price ? Number(form.price) : null,
          rent_period: form.purpose === "rent" ? form.rent_period : null,
          bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
          bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
          area: form.area ? Number(form.area) : null,
          city: form.city,
          country: form.country,
          status: "pending_review",
          ai_generated: false
        })
        .select("id")
        .single();
      if (error) throw error;

      for (const photo of photos) {
        const path = `${user.id}/${property.id}/${crypto.randomUUID()}-${photo.name}`;
        await supabase.storage.from("properties").upload(path, photo);
        await supabase.from("property_images").insert({ property_id: property.id, storage_path: path });
      }

      navigate(`/real-estate/${property.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return <div className="p-6 text-text-muted">Sign in to list a property.</div>;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
      <h1 className="text-xl font-semibold mb-1">List a property</h1>
      <div className="grid grid-cols-2 gap-2">
        <select value={form.purpose} onChange={(e) => set("purpose", e.target.value as "sale" | "rent")} className="md-input">
          <option value="rent">For rent</option>
          <option value="sale">For sale</option>
        </select>
        <select value={form.property_type} onChange={(e) => set("property_type", e.target.value)} className="md-input">
          <option value="apartment">Apartment</option>
          <option value="house">House</option>
          <option value="studio">Studio</option>
          <option value="villa">Villa</option>
          <option value="office">Office</option>
          <option value="land">Land</option>
        </select>
      </div>
      <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Title" className="md-input w-full" />
      <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Description" className="md-input w-full" rows={3} />
      <div className="grid grid-cols-2 gap-2">
        <input value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="Price" className="md-input" />
        {form.purpose === "rent" && (
          <select value={form.rent_period} onChange={(e) => set("rent_period", e.target.value)} className="md-input">
            <option value="night">per night</option>
            <option value="month">per month</option>
            <option value="year">per year</option>
          </select>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} placeholder="Bedrooms" className="md-input" />
        <input value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} placeholder="Bathrooms" className="md-input" />
        <input value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="Area (m²)" className="md-input" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" className="md-input" />
        <input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Country" className="md-input" />
      </div>
      <input type="file" multiple accept="image/*" onChange={(e) => setPhotos(Array.from(e.target.files ?? []))} className="md-input w-full" />
      <button onClick={submit} disabled={submitting} className="md-btn-primary w-full disabled:opacity-50">
        {submitting ? "Submitting..." : "Submit for review"}
      </button>
    </div>
  );
}
