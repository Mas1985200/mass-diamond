import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { MarketplaceListing } from "@/types/database";
import { LoadingState, ErrorState, ConfigRequired } from "@/components/States";
import { useAuth } from "@/hooks/useAuth";

export default function MarketplaceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [featuring, setFeaturing] = useState(false);
  const [featureError, setFeatureError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("marketplace_listings").select("*").eq("id", id).single();
      if (error) setError(error.message);
      else setListing(data as MarketplaceListing);
    })();
  }, [id]);

  // Contact seller: creates (or reuses) a message_threads row scoped
  // to this listing, then adds both participants. Seller phone numbers
  // are never exposed directly — see spec section 21.
  async function contactSeller() {
    if (!listing || !user) return;
    setStarting(true);
    try {
      const { data: thread, error: threadErr } = await supabase
        .from("message_threads")
        .insert({ context_type: "marketplace", context_id: listing.id })
        .select("id")
        .single();
      if (threadErr) throw threadErr;

      await supabase.from("thread_participants").insert([
        { thread_id: thread.id, user_id: user.id },
        { thread_id: thread.id, user_id: listing.seller_id }
      ]);

      window.location.href = `/messages?thread=${thread.id}`;
    } catch (e) {
      console.error(e);
    } finally {
      setStarting(false);
    }
  }

  // Real Stripe Checkout Session via create-checkout. The listing only
  // becomes is_featured=true after stripe-webhook confirms payment —
  // this button never flips that flag itself (also blocked by RLS,
  // see 0011_featured_flags.sql).
  async function featureListing() {
    if (!listing) return;
    setFeaturing(true);
    setFeatureError(null);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { purpose: "featured_listing", listing_id: listing.id }
      });
      if (error) throw error;
      if (data.status === "CONFIGURATION_REQUIRED") {
        setFeatureError(data.message);
        return;
      }
      window.location.href = data.checkout_url;
    } catch (e) {
      console.error(e);
      setFeatureError("Could not start checkout. Please try again.");
    } finally {
      setFeaturing(false);
    }
  }

  // Real Stripe Checkout for buying the item outright. Creates a
  // pending `orders` row immediately; stripe-webhook flips it to
  // 'paid' only after Stripe confirms — see spec section 19/34.
  async function buyNow() {
    if (!listing) return;
    setBuying(true);
    setBuyError(null);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { purpose: "marketplace_order", listing_id: listing.id }
      });
      if (error) throw error;
      if (data.status === "CONFIGURATION_REQUIRED") {
        setBuyError(data.message);
        return;
      }
      window.location.href = data.checkout_url;
    } catch (e) {
      console.error(e);
      setBuyError("Could not start checkout. Please try again.");
    } finally {
      setBuying(false);
    }
  }

  if (error) return <ErrorState label={error} />;
  if (!listing) return <LoadingState />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="aspect-video bg-surface rounded-xl2 mb-4 flex items-center justify-center text-text-muted">
        No image
      </div>
      <h1 className="text-xl font-semibold">{listing.title}</h1>
      <p className="text-primary text-lg mt-1">{listing.price ? `${listing.price} ${listing.currency}` : "Price on request"}</p>
      <p className="text-sm text-text-muted mt-1">{listing.city}, {listing.country}</p>
      {listing.ai_generated && listing.ai_suggested_price_min && (
        <p className="text-xs text-text-muted mt-2">
          AI estimate: {listing.ai_suggested_price_min}–{listing.ai_suggested_price_max} {listing.currency}
        </p>
      )}
      <p className="mt-4 whitespace-pre-wrap">{listing.description}</p>

      {user && user.id !== listing.seller_id && (
        <div className="flex gap-2 mt-6">
          <button onClick={contactSeller} disabled={starting} className="md-btn-ghost flex-1 disabled:opacity-50">
            {starting ? "Starting conversation..." : "Message seller"}
          </button>
          {listing.price != null && (
            <button onClick={buyNow} disabled={buying} className="md-btn-primary flex-1 disabled:opacity-50">
              {buying ? "Redirecting..." : "Buy now"}
            </button>
          )}
        </div>
      )}
      {buyError && <ConfigRequired label={buyError} />}
      {user && user.id !== listing.seller_id && listing.price != null && (
        <Link
          to={`/checkout/crypto?purpose=marketplace_order&amount=${listing.price}&ref=${listing.id}`}
          className="block text-center text-xs text-text-muted hover:text-primary mt-2"
        >
          Prefer to pay with crypto?
        </Link>
      )}

      {user && user.id === listing.seller_id && (
        <div className="mt-6 md-panel p-4">
          <p className="text-sm font-medium flex items-center gap-1.5"><Sparkles size={14} className="text-primary" /> Boost visibility</p>
          <p className="text-xs text-text-muted mt-1 mb-3">Feature this listing for 7 days for $4.99.</p>
          {featureError && <ConfigRequired label={featureError} />}
          <button onClick={featureListing} disabled={featuring} className="md-btn-ghost text-sm disabled:opacity-50">
            {featuring ? "Redirecting..." : "Feature this listing — $4.99"}
          </button>
        </div>
      )}
    </div>
  );
}
