// ==========================================================
// Mass Diamond — voice-stt Edge Function (speech-to-text)
// Real implementation for VOICE_PROVIDER=openai (Whisper) and
// VOICE_PROVIDER=elevenlabs. Returns CONFIGURATION_REQUIRED if
// VOICE_PROVIDER/VOICE_PROVIDER_API_KEY aren't set — never fabricates
// a transcript.
//
// Expects multipart/form-data with a single "audio" file field.
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
    const incoming = await req.formData();
    const audio = incoming.get("audio");
    if (!audio || !(audio instanceof File)) {
      return json({ error: "audio file field is required" }, 400);
    }

    if (providerName === "openai") {
      const form = new FormData();
      form.append("file", audio, "audio.webm");
      form.append("model", "whisper-1");

      const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form
      });
      if (!res.ok) return json({ error: `OpenAI STT error: ${res.status} ${await res.text()}` }, 502);
      const data = await res.json();
      return json({ status: "OK", transcript: data.text });
    }

    if (providerName === "elevenlabs") {
      const form = new FormData();
      form.append("file", audio, "audio.webm");
      form.append("model_id", "scribe_v1");

      const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: { "xi-api-key": apiKey },
        body: form
      });
      if (!res.ok) return json({ error: `ElevenLabs STT error: ${res.status} ${await res.text()}` }, 502);
      const data = await res.json();
      return json({ status: "OK", transcript: data.text });
    }

    return json({ status: "CONFIGURATION_REQUIRED", message: `Unsupported VOICE_PROVIDER for STT: ${providerName}` });
  } catch (err) {
    console.error("voice-stt error:", err);
    return json({ error: "Internal error processing audio" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
}
