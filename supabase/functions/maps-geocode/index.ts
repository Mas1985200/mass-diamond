// ==========================================================
// Mass Diamond — maps-geocode Edge Function
// Reverse-geocodes GPS coordinates into city/country using a
// configured maps provider. Requires MAPS_PROVIDER +
// MAPS_PROVIDER_API_KEY. Returns CONFIGURATION_REQUIRED otherwise —
// never guesses a place name from coordinates alone.
// ==========================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { latitude, longitude } = await req.json();
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return json({ error: "latitude and longitude (numbers) are required" }, 400);
    }

    const providerName = Deno.env.get("MAPS_PROVIDER");
    const apiKey = Deno.env.get("MAPS_PROVIDER_API_KEY");

    if (!providerName || providerName === "none" || !apiKey) {
      return json({ status: "CONFIGURATION_REQUIRED", message: "Maps provider is not configured." });
    }

    if (providerName === "google") {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status !== "OK" || !data.results?.length) {
        return json({ status: "CONFIGURATION_REQUIRED", message: `Google geocoding returned: ${data.status}` });
      }
      const components = data.results[0].address_components as { long_name: string; types: string[] }[];
      const city = components.find((c) => c.types.includes("locality"))?.long_name;
      const country = components.find((c) => c.types.includes("country"))?.long_name;
      return json({ status: "OK", city, country });
    }

    if (providerName === "mapbox") {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=place,country&access_token=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      const place = data.features?.find((f: { place_type: string[] }) => f.place_type.includes("place"));
      const country = data.features?.find((f: { place_type: string[] }) => f.place_type.includes("country"));
      return json({ status: "OK", city: place?.text, country: country?.text });
    }

    return json({ status: "CONFIGURATION_REQUIRED", message: `Unsupported MAPS_PROVIDER: ${providerName}` });
  } catch (err) {
    console.error("maps-geocode error:", err);
    return json({ error: "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
}
