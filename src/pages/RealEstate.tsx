import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, BadgeCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Property } from "@/types/database";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";

export default function RealEstate() {
  const { t } = useTranslation();
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<"all" | "sale" | "rent">("all");
  const [bedrooms, setBedrooms] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  async function load() {
    setError(null);
    setProperties(null);
    let q = supabase.from("properties").select("*").eq("status", "published").order("is_featured", { ascending: false }).order("created_at", { ascending: false }).limit(50);
    if (purpose !== "all") q = q.eq("purpose", purpose);
    if (bedrooms) q = q.gte("bedrooms", Number(bedrooms));
    if (maxPrice) q = q.lte("price", Number(maxPrice));

    const { data, error } = await q;
    if (error) {
      setError(error.message);
      return;
    }
    setProperties(data as Property[]);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-semibold">{t("nav.realEstate")}</h1>
        <Link to="/real-estate/new" className="md-btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={16} /> List a property
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <select value={purpose} onChange={(e) => setPurpose(e.target.value as typeof purpose)} className="md-input">
          <option value="all">For sale or rent</option>
          <option value="sale">For sale</option>
          <option value="rent">For rent</option>
        </select>
        <input value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} placeholder="Min bedrooms" className="md-input" />
        <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max price" className="md-input" />
      </div>
      <button onClick={load} className="md-btn-ghost text-sm mb-6">Apply filters</button>

      {properties === null && !error && <LoadingState />}
      {error && <ErrorState label={error} onRetry={load} />}
      {properties && properties.length === 0 && <EmptyState label={t("empty.properties")} />}

      {properties && properties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {properties.map((p) => (
            <Link key={p.id} to={`/real-estate/${p.id}`} className="md-panel p-3 hover:border-primary/50 transition-colors">
              <div className="aspect-video bg-surface rounded-lg mb-2 flex items-center justify-center text-text-muted text-xs relative">
                No image
                {p.is_featured && (
                  <span className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-primary text-background text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                    <BadgeCheck size={10} /> Featured
                  </span>
                )}
              </div>
              <p className="text-sm font-medium truncate">{p.title}</p>
              <p className="text-primary text-sm mt-1">
                {p.price ? `${p.price} ${p.currency}${p.purpose === "rent" ? `/${p.rent_period ?? "month"}` : ""}` : "Price on request"}
              </p>
              <p className="text-xs text-text-muted">{p.bedrooms ?? "-"} bd · {p.bathrooms ?? "-"} ba · {p.area ?? "-"} m²</p>
              <p className="text-xs text-text-muted truncate">{p.city}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
