// ==========================================================
// Mass Diamond — location detection
// Layered per spec section 11:
//   1. profile (already known)
//   2. browser/device locale (always available, no permission needed)
//   3. approximate IP location (geo-lookup Edge Function)
//   4. precise GPS (only after explicit user action — never silent),
//      reverse-geocoded via the maps-geocode Edge Function
// ==========================================================

import { supabase } from "./supabase";

export function getLocaleGuess(): { country?: string; language: string } {
  const language = navigator.language || "en";
  const region = language.split("-")[1];
  return { country: region, language };
}

export interface GpsResult {
  latitude: number;
  longitude: number;
}

/**
 * Requests precise GPS ONLY when explicitly called from a user action
 * (e.g. a "Use my current location" button). Never call this on page
 * load or silently — see spec section 11.
 */
export function requestPreciseLocation(): Promise<GpsResult> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  });
}

interface ProviderResponse {
  status: "OK" | "CONFIGURATION_REQUIRED";
  message?: string;
  city?: string;
  country?: string;
}

/**
 * Approximate IP-based location via the geo-lookup Edge Function.
 * Returns null (with no error thrown) if the provider isn't
 * configured/reachable — callers should fall back to manual entry,
 * never fabricate a location.
 */
export async function getApproximateIpLocation(): Promise<{ country?: string; city?: string } | null> {
  try {
    const { data, error } = await supabase.functions.invoke<ProviderResponse>("geo-lookup", { body: {} });
    if (error || !data || data.status !== "OK") return null;
    return { city: data.city, country: data.country };
  } catch {
    return null;
  }
}

/**
 * Reverse-geocodes GPS coordinates into a city/country pair via the
 * maps-geocode Edge Function. Returns null if no maps provider is
 * configured — the caller (Profile page) surfaces that explicitly
 * rather than guessing.
 */
export async function reverseGeocode(coords: GpsResult): Promise<{ city?: string; country?: string } | null> {
  try {
    const { data, error } = await supabase.functions.invoke<ProviderResponse>("maps-geocode", { body: coords });
    if (error || !data || data.status !== "OK") return null;
    return { city: data.city, country: data.country };
  } catch {
    return null;
  }
}
