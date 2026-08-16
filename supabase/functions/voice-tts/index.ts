// ==========================================================
// Mass Diamond — voice-tts Edge Function (text-to-speech)
// Real implementation for VOICE_PROVIDER=openai and
// VOICE_PROVIDER=elevenlabs. Returns raw audio bytes on success, or
// CONFIGURATION_REQUIRED JSON if no provider is set.
// ==========================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const providerName = Deno.env.get("VOICE_PROVIDER");
  const apiKey = Deno.env.get("VOICE_PROVIDER_API_KEY");

  if (!providerName || providerName === "none" || !apiKey) {
    return json({ status: "CONFIGURATION_REQUIRED", message: "Voice provider is not configured." });
  }

  try {
    const { text, voice } = await req.json();
    if (!text) return json({ error: "text is required" }, 400);

    if (providerName === "openai") {
      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ model: "tts-1", voice: voice ?? "alloy", input: text })
      });
      if (!res.ok) return json({ error: `OpenAI TTS error: ${res.status} ${await res.text()}` }, 502);
      return new Response(res.body, { headers: { ...corsHeaders, "content-type": "audio/mpeg" } });
    }

    if (providerName === "elevenlabs") {
      const voiceId = voice ?? "21m00Tcm4TlvDq8ikWAM"; // ElevenLabs default voice
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: { "xi-api-key": apiKey, "content-type": "application/json" },
        body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" })
      });
      if (!res.ok) return json({ error: `ElevenLabs TTS error: ${res.status} ${await res.text()}` }, 502);
      return new Response(res.body, { headers: { ...corsHeaders, "content-type": "audio/mpeg" } });
    }

    return json({ status: "CONFIGURATION_REQUIRED", message: `Unsupported VOICE_PROVIDER for TTS: ${providerName}` });
  } catch (err) {
    console.error("voice-tts error:", err);
    return json({ error: "Internal error generating speech" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
}
