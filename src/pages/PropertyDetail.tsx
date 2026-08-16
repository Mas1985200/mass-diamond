import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Property } from "@/types/database";
import { LoadingState, ErrorState, ConfigRequired } from "@/components/States";
import { useAuth } from "@/hooks/useAuth";

export default function PropertyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [featuring, setFeaturing] = useState(false);
  const [featureError, setFeatureError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("properties").select("*").eq("id", id).single();
      if (error) setError(error.message);
      else setProperty(data as Property);
    })();
  }, [id]);

  async function contactOwner() {
    if (!property || !user) return;
    setStarting(true);
    try {
      const { data: thread, error: threadErr } = await supabase
        .from("message_threads")
        .insert({ context_type: "real_estate", context_id: property.id })
        .select("id")
        .single();
      if (threadErr) throw threadErr;
      await supabase.from("thread_participants").insert([
        { thread_id: thread.id, user_id: user.id },
        { thread_id: thread.id, user_id: property.owner_id }
      ]);
      window.location.href = `/messages?thread=${thread.id}`;
    } catch (e) {
      console.error(e);
    } finally {
      setStarting(false);
    }
  }

  async function featureProperty() {
    if (!property) return;
    setFeaturing(true);
    setFeatureError(null);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { purpose: "featured_property", property_id: property.id }
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

  if (error) return <ErrorState label={error} />;
  if (!property) return <LoadingState />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="aspect-video bg-surface rounded-xl2 mb-4 flex items-center justify-center text-text-muted">
        No image
      </div>
      <h1 className="text-xl font-semibold">{property.title}</h1>
      <p className="text-primary text-lg mt-1">
        {property.price ? `${property.price} ${property.currency}${property.purpose === "rent" ? `/${property.rent_period ?? "month"}` : ""}` : "Price on request"}
      </p>
      <p className="text-sm text-text-muted mt-1">{property.city}, {property.country}</p>
      <div className="flex gap-4 mt-3 text-sm text-text-muted">
        <span>{property.bedrooms ?? "-"} bedrooms</span>
        <span>{property.bathrooms ?? "-"} bathrooms</span>
        <span>{property.area ?? "-"} m²</span>
      </div>
      <p className="mt-4 whitespace-pre-wrap">{property.description}</p>

      {user && user.id !== property.owner_id && (
        <button onClick={contactOwner} disabled={starting} className="md-btn-primary mt-6 disabled:opacity-50">
          {starting ? "Starting conversation..." : "Message owner"}
        </button>
      )}

      {user && user.id === property.owner_id && (
        <div className="mt-6 md-panel p-4">
          <p className="text-sm font-medium flex items-center gap-1.5"><Sparkles size={14} className="text-primary" /> Boost visibility</p>
          <p className="text-xs text-text-muted mt-1 mb-3">Feature this property for 7 days for $9.99.</p>
          {featureError && <ConfigRequired label={featureError} />}
          <button onClick={featureProperty} disabled={featuring} className="md-btn-ghost text-sm disabled:opacity-50">
            {featuring ? "Redirecting..." : "Feature this property — $9.99"}
          </button>
          <Link to={`/checkout/crypto?purpose=featured_property&amount=9.99&ref=${property.id}`} className="block text-center text-xs text-text-muted hover:text-primary mt-2">
            Prefer to pay with crypto?
          </Link>
        </div>
      )}    </div>
  );
}
