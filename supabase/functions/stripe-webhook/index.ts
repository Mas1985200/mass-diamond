// ==========================================================
// Mass Diamond — stripe-webhook Edge Function
//
// This is the ONLY place in the entire codebase that marks a payment
// as "succeeded", activates a subscription, or flips is_featured to
// true. It verifies the Stripe signature before trusting anything in
// the request body — per spec section 34, no payment success is ever
// simulated or trusted from the client.
//
// Configure in the Stripe Dashboard: Webhooks -> Add endpoint ->
//   https://<project-ref>.functions.supabase.co/stripe-webhook
//   events: checkout.session.completed, checkout.session.expired,
//           invoice.payment_failed, customer.subscription.deleted
// ==========================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const webhookSecret = Deno.env.get("PAYMENT_WEBHOOK_SECRET");
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  if (!webhookSecret) {
    console.error("PAYMENT_WEBHOOK_SECRET is not configured — rejecting webhook.");
    return new Response("Webhook not configured", { status: 500 });
  }
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event;
  try {
    event = await verifyStripeSignature(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const paymentId = session.metadata?.payment_id;
        const userId = session.metadata?.user_id;
        if (!paymentId) break;

        await admin.from("payments").update({ status: "succeeded" }).eq("id", paymentId);

        const { data: payment } = await admin.from("payments").select("purpose, metadata").eq("id", paymentId).single();
        if (!payment) break;

        const meta = payment.metadata as { plan?: string; listing_id?: string; property_id?: string };

        if (payment.purpose === "subscription" && meta.plan && userId) {
          await admin.from("subscriptions").upsert(
            {
              user_id: userId,
              plan: meta.plan,
              status: "active",
              provider: "stripe",
              provider_subscription_id: session.subscription ?? null,
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            },
            { onConflict: "user_id" }
          );
        }

        if (payment.purpose === "featured_listing" && meta.listing_id) {
          await admin
            .from("marketplace_listings")
            .update({ is_featured: true, featured_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
            .eq("id", meta.listing_id);
        }

        if (payment.purpose === "featured_property" && meta.property_id) {
          await admin
            .from("properties")
            .update({ is_featured: true, featured_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
            .eq("id", meta.property_id);
        }

        if (payment.purpose === "marketplace_order") {
          const orderId = session.metadata?.order_id;
          if (orderId) {
            await admin.from("orders").update({ status: "paid" }).eq("id", orderId);
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const paymentId = session.metadata?.payment_id;
        if (paymentId) await admin.from("payments").update({ status: "failed" }).eq("id", paymentId);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await admin
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("provider_subscription_id", sub.id);
        break;
      }

      default:
        // Unhandled event types are acknowledged but ignored.
        break;
    }

    return new Response(JSON.stringify({ received: true }), { headers: { "content-type": "application/json" } });
  } catch (err) {
    console.error("stripe-webhook processing error:", err);
    return new Response("Internal error", { status: 500 });
  }
});

// Minimal Stripe webhook signature verification (HMAC-SHA256 over
// "{timestamp}.{payload}"), implemented without the Stripe SDK so this
// runs on any Deno Edge Function runtime.
async function verifyStripeSignature(payload: string, sigHeader: string, secret: string) {
  const parts = Object.fromEntries(sigHeader.split(",").map((p) => p.split("=") as [string, string]));
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) throw new Error("Malformed stripe-signature header");

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign"
  ]);
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const expected = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expected !== signature) throw new Error("Signature mismatch");

  // Reject events older than 5 minutes to mitigate replay attacks.
  const age = Date.now() / 1000 - Number(timestamp);
  if (age > 300) throw new Error("Webhook timestamp too old");

  return JSON.parse(payload);
}
