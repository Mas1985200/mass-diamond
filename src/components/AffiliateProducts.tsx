import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState, LoadingState } from "@/components/States";

interface Product {
  id: string;
  title: string;
  url: string;
  image_url: string | null;
  price: number | null;
  currency: string | null;
}

// Renders real affiliate_products rows and records a real row in
// affiliate_clicks on outbound click — this is the "outbound-link
// instrumentation" called out as missing in the README. Conversions
// are still only ever written by a verified affiliate-network webhook
// server-side (never from this click handler) — see 0008_monetization.sql.
export function AffiliateProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("affiliate_products")
        .select("id, title, url, image_url, price, currency")
        .limit(20);
      setProducts((data ?? []) as Product[]);
    })();
  }, []);

  async function handleClick(product: Product) {
    await supabase.from("affiliate_clicks").insert({ product_id: product.id, user_id: user?.id ?? null });
  }

  if (products === null) return <LoadingState />;
  if (products.length === 0) return <EmptyState label="No affiliate products available yet." />;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {products.map((p) => (
        <a
          key={p.id}
          href={p.url}
          target="_blank"
          rel="noreferrer sponsored"
          onClick={() => handleClick(p)}
          className="md-panel p-3 hover:border-primary/50 transition-colors"
        >
          <div className="aspect-square bg-surface rounded-lg mb-2 overflow-hidden flex items-center justify-center text-text-muted text-xs">
            {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : "No image"}
          </div>
          <p className="text-sm font-medium truncate">{p.title}</p>
          {p.price != null && (
            <p className="text-primary text-sm mt-1">
              {p.price} {p.currency ?? "USD"}
            </p>
          )}
        </a>
      ))}
    </div>
  );
}
