import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Business } from "@/types/database";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";

export default function Businesses() {
  const { t } = useTranslation();
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");

  async function load() {
    setError(null);
    setBusinesses(null);
    let q = supabase.from("businesses").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(50);
    if (query.trim()) q = q.ilike("name", `%${query.trim()}%`);
    if (city.trim()) q = q.ilike("city", `%${city.trim()}%`);

    const { data, error } = await q;
    if (error) {
      setError(error.message);
      return;
    }
    setBusinesses(data as Business[]);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-semibold">{t("nav.businesses")}</h1>
        <Link to="/businesses/new" className="md-btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={16} /> Add a business
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="grid grid-cols-2 gap-2 mb-6"
      >
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Business name, e.g. Persian restaurant" className="md-input" />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="md-input" />
      </form>

      {businesses === null && !error && <LoadingState />}
      {error && <ErrorState label={error} onRetry={load} />}
      {businesses && businesses.length === 0 && <EmptyState label={t("empty.businesses")} />}

      {businesses && businesses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {businesses.map((b) => (
            <Link key={b.id} to={`/businesses/${b.id}`} className="md-panel p-3 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">{b.name}</p>
                {b.verification_status === "verified" && <Star size={14} className="text-primary shrink-0" />}
              </div>
              <p className="text-xs text-text-muted truncate mt-1">{b.city}, {b.country}</p>
              {b.description && <p className="text-xs text-text-muted line-clamp-2 mt-1">{b.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
