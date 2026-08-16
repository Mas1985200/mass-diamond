// ==========================================================
// Mass Diamond — geo-lookup Edge Function
// Approximate IP-based location (spec section 11, layer 3). Runs
// server-side so the client's IP (not a spoofable header) is used.
// Uses ipapi.co by default; swap provider by editing the fetch below.
// No API key required for ipapi.co's free tier (rate-limited), but we
// still gate it behind a config flag so it's explicit and can be
// swapped or disabled per deployment.
// ==========================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const enabled = Deno.env.get("IP_GEOLOCATION_ENABLED");
  if (enabled === "false") {
    return json({ status: "CONFIGURATION_REQUIRED", message: "IP geolocation is disabled for this deployment." });
  }

  try {
    // The Edge Function runtime forwards the caller's real IP in this
    // header; fall back gracefully if it's absent (e.g. local dev).
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    const url = ip ? `https://ipapi.co/${ip}/json/` : "https://ipapi.co/json/";
    const res = await fetch(url);
    if (!res.ok) {
      return json({ status: "CONFIGURATION_REQUIRED", message: "IP geolocation provider returned an error." });
    }
    const data = await res.json();
    if (data.error) {
      return json({ status: "CONFIGURATION_REQUIRED", message: data.reason ?? "IP geolocation lookup failed." });
    }

    return json({
      status: "OK",
      country: data.country_name,
      country_code: data.country_code,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude
    });
  } catch (err) {
    console.error("geo-lookup error:", err);
    return json({ status: "CONFIGURATION_REQUIRED", message: "Could not reach IP geolocation provider." });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
}
