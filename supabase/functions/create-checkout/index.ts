// ==========================================================
// Mass Diamond — create-checkout Edge Function
//
// Creates a real Stripe Checkout Session for one of:
//   purpose = "subscription"       -> plan: "pro_ai" | "business_basic" | "business_pro"
//   purpose = "featured_listing"   -> listing_id
//   purpose = "featured_property"  -> property_id
//
// Requires PAYMENT_PROVIDER=stripe and PAYMENT_PROVIDER_SECRET (Stripe
// secret key) as Edge Function secrets. Returns CONFIGURATION_REQUIRED
// otherwise — never simulates a successful checkout. The actual
// `payments`/`subscriptions` row is only ever written by
// stripe-webhook after Stripe confirms the payment server-side, never
// by this function or the client.
// ==========================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const PRICES: Record<string, { amount: number; currency: string; label: string }> = {
  pro_ai: { amount: 999, currency: "usd", label: "Mass Diamond Pro AI (monthly)" },
  business_basic: { amount: 1999, currency: "usd", label: "Business Basic (monthly)" },
  business_pro: { amount: 4999, currency: "usd", label: "Business Pro (monthly)" },
  featured_listing: { amount: 499, currency: "usd", label: "Featured marketplace listing (7 days)" },
  featured_property: { amount: 999, currency: "usd", label: "Featured property listing (7 days)" }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });

    const {
      data: { user },
      error: userErr
    } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Invalid or expired session" }, 401);

    const secretKey = Deno.env.get("PAYMENT_PROVIDER_SECRET");
    const providerName = Deno.env.get("PAYMENT_PROVIDER");

    if (!providerName || providerName === "none" || !secretKey) {
      return json({ status: "CONFIGURATION_REQUIRED", message: "Payment provider is not configured." });
    }
    if (providerName !== "stripe") {
      return json({ status: "CONFIGURATION_REQUIRED", message: `Unsupported PAYMENT_PROVIDER: ${providerName}` });
    }

    const body = await req.json();
    const { purpose, plan, listing_id, property_id, success_url, cancel_url } = body;

    // marketplace_order is priced dynamically from the listing itself,
    // not from the static PRICES table, and also creates an `orders`
    // row alongside the `payments` row.
    let price: { amount: number; currency: string; label: string };
    let listingForOrder: { id: string; seller_id: string } | null = null;

    if (purpose === "marketplace_order") {
      const { data: listing, error: listingErr } = await userClient
        .from("marketplace_listings")
        .select("id, title, price, currency, seller_id, status")
        .eq("id", listing_id)
        .single();
      if (listingErr || !listing) return json({ error: "Listing not found" }, 404);
      if (listing.status !== "published") return json({ error: "This listing is not available for purchase" }, 400);
      if (!listing.price) return json({ error: "This listing has no price set" }, 400);
      if (listing.seller_id === user.id) return json({ error: "You cannot buy your own listing" }, 400);

      price = { amount: Math.round(listing.price * 100), currency: (listing.currency ?? "USD").toLowerCase(), label: listing.title };
      listingForOrder = { id: listing.id, seller_id: listing.seller_id };
    } else {
      const priceKey = purpose === "subscription" ? plan : purpose;
      const found = PRICES[priceKey];
      if (!found) return json({ error: `Unknown checkout item: ${priceKey}` }, 400);
      price = found;
    }

    // Record a pending payment row up front so we can reconcile the
    // Stripe session on webhook confirmation.
    const { data: payment, error: paymentErr } = await userClient
      .from("payments")
      .insert({
        user_id: user.id,
        amount: price.amount / 100,
        currency: price.currency.toUpperCase(),
        provider: "stripe",
        status: "pending",
        purpose,
        metadata: { plan, listing_id, property_id }
      })
      .select("id")
      .single();
    if (paymentErr) throw paymentErr;

    // For a marketplace purchase, also create the pending order now so
    // the buyer has an order record even before Stripe confirms —
    // stripe-webhook flips it to 'paid' on confirmation.
    let orderId: string | undefined;
    if (purpose === "marketplace_order" && listingForOrder) {
      const { data: order, error: orderErr } = await userClient
        .from("orders")
        .insert({
          buyer_id: user.id,
          listing_id: listingForOrder.id,
          payment_id: payment.id,
          amount: price.amount / 100,
          currency: price.currency.toUpperCase(),
          status: "pending"
        })
        .select("id")
        .single();
      if (orderErr) throw orderErr;
      orderId = order.id;
    }

    // Create the Stripe Checkout Session via Stripe's REST API directly
    // (no SDK dependency needed for Deno Edge Functions).
    const params = new URLSearchParams({
      mode: purpose === "subscription" ? "subscription" : "payment",
      "line_items[0][price_data][currency]": price.currency,
      "line_items[0][price_data][product_data][name]": price.label,
      "line_items[0][price_data][unit_amount]": String(price.amount),
      "line_items[0][quantity]": "1",
      success_url: success_url ?? `${req.headers.get("origin") ?? ""}/profile?checkout=success`,
      cancel_url: cancel_url ?? `${req.headers.get("origin") ?? ""}/profile?checkout=cancelled`,
      client_reference_id: payment.id,
      "metadata[payment_id]": payment.id,
      "metadata[user_id]": user.id,
      ...(orderId ? { "metadata[order_id]": orderId } : {})
    });
    if (purpose === "subscription") {
      params.set("line_items[0][price_data][recurring][interval]", "month");
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });

    if (!stripeRes.ok) {
      const errText = await stripeRes.text();
      console.error("Stripe error:", errText);
      return json({ error: "Failed to create checkout session" }, 502);
    }

    const session = await stripeRes.json();

    await userClient.from("payments").update({ provider_reference: session.id }).eq("id", payment.id);

    return json({ status: "OK", checkout_url: session.url, payment_id: payment.id });
  } catch (err) {
    console.error("create-checkout error:", err);
    return json({ error: "Internal error creating checkout session" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
}
