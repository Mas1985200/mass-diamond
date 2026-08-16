import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, BadgeCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { MarketplaceListing } from "@/types/database";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";
import { AdBanner } from "@/components/AdBanner";

export default function Marketplace() {
  const { t } = useTranslation();
  const [listings, setListings] = useState<MarketplaceListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    setError(null);
    setListings(null);
    // RLS ensures only status='published' listings (or the caller's
    // own) come back — see supabase/migrations/0003_marketplace.sql.
    let q = supabase
      .from("marketplace_listings")
      .select("*")
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (query.trim()) {
      q = q.ilike("title", `%${query.trim()}%`);
    }

    const { data, error } = await q;
    if (error) {
      setError(error.message);
      return;
    }
    setListings(data as MarketplaceListing[]);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-semibold">{t("nav.marketplace")}</h1>
        <Link to="/marketplace/new" className="md-btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={16} /> Sell an item
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="mb-6"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search marketplace..."
          className="md-input w-full"
        />
      </form>

      <div className="mb-6">
        <AdBanner targetCategory="marketplace" />
      </div>

      {listings === null && !error && <LoadingState />}
      {error && <ErrorState label={error} onRetry={load} />}
      {listings && listings.length === 0 && <EmptyState label={t("empty.marketplace")} />}

      {listings && listings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {listings.map((l) => (
            <Link key={l.id} to={`/marketplace/${l.id}`} className="md-panel p-3 hover:border-primary/50 transition-colors">
              <div className="aspect-square bg-surface rounded-lg mb-2 flex items-center justify-center text-text-muted text-xs relative">
                No image
                {l.is_featured && (
                  <span className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-primary text-background text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                    <BadgeCheck size={10} /> Featured
                  </span>
                )}
              </div>
              <p className="text-sm font-medium truncate">{l.title}</p>
              <p className="text-primary text-sm mt-1">
                {l.price ? `${l.price} ${l.currency}` : "Price on request"}
              </p>
              <p className="text-xs text-text-muted truncate">{l.city ?? l.location_text}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
