// ==========================================================
// Mass Diamond — affiliate-webhook Edge Function
//
// Receives conversion pings from an affiliate network and records a
// real affiliate_conversions + commissions row. Verified with a
// shared-secret header (AFFILIATE_WEBHOOK_SECRET) — never trusts an
// unauthenticated request, and never fabricates a conversion from
// client-side code (per spec section 37: "Do not fake affiliate
// conversions").
//
// Expected payload:
//   { click_id, product_id, order_value, currency, commission_amount }
// Configure your affiliate network to POST here with header:
//   x-affiliate-secret: <AFFILIATE_WEBHOOK_SECRET>
// ==========================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const secret = Deno.env.get("AFFILIATE_WEBHOOK_SECRET");
  if (!secret) {
    return new Response(JSON.stringify({ status: "CONFIGURATION_REQUIRED", message: "Affiliate webhook secret is not configured." }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }

  const provided = req.headers.get("x-affiliate-secret");
  if (provided !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { click_id, product_id, order_value, currency, commission_amount } = body;
    if (!product_id) return new Response(JSON.stringify({ error: "product_id is required" }), { status: 400 });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: conversion, error: convErr } = await admin
      .from("affiliate_conversions")
      .insert({ click_id: click_id ?? null, product_id, order_value, currency: currency ?? "USD" })
      .select("id")
      .single();
    if (convErr) throw convErr;

    if (commission_amount) {
      await admin.from("commissions").insert({
        conversion_id: conversion.id,
        amount: commission_amount,
        currency: currency ?? "USD",
        status: "pending"
      });
    }

    return new Response(JSON.stringify({ status: "OK", conversion_id: conversion.id }), {
      headers: { "content-type": "application/json" }
    });
  } catch (err) {
    console.error("affiliate-webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});
