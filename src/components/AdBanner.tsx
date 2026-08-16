import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
}

interface AdBannerProps {
  targetCategory?: string;
  targetCity?: string;
}

// Renders real, admin-approved advertisements from the `advertisements`
// table (status = 'active' only — enforced by RLS in
// 0008_monetization.sql). Renders nothing if none are active, rather
// than showing a placeholder ad, per "no fake functionality".
export function AdBanner({ targetCategory, targetCity }: AdBannerProps) {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    (async () => {
      let q = supabase.from("advertisements").select("id, title, description, image_url").eq("status", "active").limit(1);
      if (targetCategory) q = q.eq("target_category", targetCategory);
      if (targetCity) q = q.eq("target_city", targetCity);
      const { data } = await q;
      setAd((data?.[0] as Ad) ?? null);
    })();
  }, [targetCategory, targetCity]);

  if (!ad) return null;

  return (
    <div className="md-panel p-3 flex items-center gap-3 border-primary/20">
      {ad.image_url && <img src={ad.image_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-text-muted uppercase tracking-wide">Sponsored</p>
        <p className="text-sm font-medium truncate">{ad.title}</p>
        {ad.description && <p className="text-xs text-text-muted truncate">{ad.description}</p>}
      </div>
    </div>
  );
}
