// ==========================================================
// Mass Diamond — search Edge Function
// Server-side search provider abstraction. Returns a clear
// CONFIGURATION_REQUIRED state when no provider is set — never
// fabricated results.
// ==========================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

async function searchWithBing(query: string, apiKey: string): Promise<SearchResult[]> {
  const res = await fetch(`https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}`, {
    headers: { "Ocp-Apim-Subscription-Key": apiKey }
  });
  if (!res.ok) throw new Error(`Bing search error: ${res.status}`);
  const data = await res.json();
  return (data.webPages?.value ?? []).map((r: { name: string; url: string; snippet: string }) => ({
    title: r.name,
    url: r.url,
    snippet: r.snippet
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query) return json({ error: "query is required" }, 400);

    const providerName = Deno.env.get("SEARCH_PROVIDER");
    const apiKey = Deno.env.get("SEARCH_PROVIDER_API_KEY");

    if (!providerName || providerName === "none" || !apiKey) {
      return json({
        status: "CONFIGURATION_REQUIRED",
        message: "Search provider is not configured."
      });
    }

    let results: SearchResult[] = [];
    if (providerName === "bing") {
      results = await searchWithBing(query, apiKey);
    } else {
      return json({ status: "CONFIGURATION_REQUIRED", message: `Unsupported SEARCH_PROVIDER: ${providerName}` });
    }

    return json({ status: "OK", results });
  } catch (err) {
    console.error("search error:", err);
    return json({ error: "Internal error processing search request" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" }
  });
}
