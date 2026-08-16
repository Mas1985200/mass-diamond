import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MapPin, Crown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/hooks/useAuth";
import { SUPPORTED_LANGUAGES, isRtl } from "@/lib/i18n";
import { requestPreciseLocation, reverseGeocode, getApproximateIpLocation } from "@/lib/location";
import type { Profile } from "@/types/database";
import { LoadingState, ConfigRequired } from "@/components/States";

export default function ProfilePage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>("free");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      const p = data as Profile;
      setProfile(p);

      // Layer 3 of spec section 11: if the user has no location on file
      // yet, suggest one via IP geolocation — never silently overwrite,
      // just prefill so they can confirm/edit.
      if (p && !p.city && !p.country) {
        const ipGuess = await getApproximateIpLocation();
        if (ipGuess?.city || ipGuess?.country) {
          setProfile((prev) => (prev ? { ...prev, city: ipGuess.city ?? prev.city, country: ipGuess.country ?? prev.country } : prev));
          setLocationNote("Prefilled from your approximate location — please confirm or edit.");
        }
      }

      const { data: sub } = await supabase.from("subscriptions").select("plan, status").eq("user_id", user.id).eq("status", "active").maybeSingle();
      if (sub) setSubscriptionPlan(sub.plan);
    })();
  }, [user]);

  async function save() {
    if (!user || !profile) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name,
          country: profile.country,
          city: profile.city,
          preferred_language: profile.preferred_language
        })
        .eq("id", user.id);

      i18n.changeLanguage(profile.preferred_language);
      document.documentElement.dir = isRtl(profile.preferred_language) ? "rtl" : "ltr";
    } finally {
      setSaving(false);
    }
  }

  // GPS is requested ONLY here, from an explicit button press — never
  // automatically. If permission is denied, the app keeps working with
  // manual city/country entry (spec section 11).
  async function useMyLocation() {
    setLocating(true);
    setLocationNote(null);
    try {
      const coords = await requestPreciseLocation();
      const place = await reverseGeocode(coords);
      if (place?.city || place?.country) {
        setProfile((p) => (p ? { ...p, city: place.city ?? p.city, country: place.country ?? p.country } : p));
        setLocationNote("Location updated. Remember to save.");
      } else {
        setLocationNote(
          `Got your coordinates (${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}), but converting them to a city/country needs a maps provider — set MAPS_PROVIDER_API_KEY. You can enter your city manually below for now.`
        );
      }
    } catch (err) {
      setLocationNote("Couldn't access your location. You can enter your city and country manually below.");
      console.error(err);
    } finally {
      setLocating(false);
    }
  }

  async function uploadAvatar(file: File) {
    if (!user) return;
    const path = `${user.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setProfile((p) => (p ? { ...p, avatar_url: data.publicUrl } : p));
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
  }

  // Calls the real create-checkout Edge Function, which creates an
  // actual Stripe Checkout Session. Nothing here marks the
  // subscription active — only stripe-webhook does that, after Stripe
  // confirms payment server-side (spec section 34).
  async function upgradeTo(plan: string) {
    setCheckoutLoading(plan);
    setCheckoutError(null);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { purpose: "subscription", plan }
      });
      if (error) throw error;
      if (data.status === "CONFIGURATION_REQUIRED") {
        setCheckoutError(data.message);
        return;
      }
      window.location.href = data.checkout_url;
    } catch (e) {
      console.error(e);
      setCheckoutError("Could not start checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  if (!user) return <div className="p-6 text-text-muted">Sign in to view your profile.</div>;
  if (!profile) return <LoadingState />;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-semibold">Profile</h1>

      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-surface overflow-hidden flex items-center justify-center text-text-muted">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : "No photo"}
        </div>
        <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} className="text-sm" />
      </div>

      <div>
        <label className="text-xs text-text-muted">Display name</label>
        <input
          value={profile.display_name ?? ""}
          onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
          className="md-input w-full mt-1"
        />
      </div>

      <div>
        <label className="text-xs text-text-muted">Language</label>
        <select
          value={profile.preferred_language}
          onChange={(e) => setProfile({ ...profile, preferred_language: e.target.value })}
          className="md-input w-full mt-1"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>{lang.toUpperCase()}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-text-muted">Country</label>
          <input value={profile.country ?? ""} onChange={(e) => setProfile({ ...profile, country: e.target.value })} className="md-input w-full mt-1" />
        </div>
        <div>
          <label className="text-xs text-text-muted">City</label>
          <input value={profile.city ?? ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className="md-input w-full mt-1" />
        </div>
      </div>
      <button onClick={useMyLocation} disabled={locating} className="md-btn-ghost w-full text-sm flex items-center justify-center gap-2 disabled:opacity-50">
        <MapPin size={16} /> {locating ? "Getting location..." : "Use my current location"}
      </button>
      {locationNote && <p className="text-xs text-text-muted">{locationNote}</p>}

      <button onClick={save} disabled={saving} className="md-btn-primary w-full disabled:opacity-50">
        {saving ? "Saving..." : "Save changes"}
      </button>

      <div className="md-panel p-4">
        <div className="flex items-center gap-2 mb-1">
          <Crown size={16} className="text-primary" />
          <p className="text-sm font-medium">Subscription: {subscriptionPlan.replace("_", " ")}</p>
        </div>
        <p className="text-xs text-text-muted mb-3">Upgrade for unlimited AI chat and business tools.</p>
        {checkoutError && <ConfigRequired label={checkoutError} />}
        <div className="grid grid-cols-1 gap-2">
          {subscriptionPlan !== "pro_ai" && (
            <button onClick={() => upgradeTo("pro_ai")} disabled={checkoutLoading === "pro_ai"} className="md-btn-ghost text-sm disabled:opacity-50">
              {checkoutLoading === "pro_ai" ? "Redirecting..." : "Upgrade to Pro AI — $9.99/mo"}
            </button>
          )}
          {subscriptionPlan !== "business_basic" && (
            <button onClick={() => upgradeTo("business_basic")} disabled={checkoutLoading === "business_basic"} className="md-btn-ghost text-sm disabled:opacity-50">
              {checkoutLoading === "business_basic" ? "Redirecting..." : "Business Basic — $19.99/mo"}
            </button>
          )}
        </div>
        <Link to="/checkout/crypto?purpose=subscription&amount=9.99" className="block text-center text-xs text-text-muted hover:text-primary mt-3">
          Prefer to pay with crypto?
        </Link>
      </div>

      <button onClick={() => signOut()} className="md-btn-ghost w-full">
        Sign out
      </button>
    </div>
  );
}
