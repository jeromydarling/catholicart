// Supabase edge function: stripe-webhook
// ────────────────────────────────────────────────────────────────────
// Endpoint: POST /functions/v1/stripe-webhook
// Receives Stripe webhook events. Verifies the signature with
// STRIPE_WEBHOOK_SECRET. Translates relevant events into our domain.
//
// Deploy:
//   supabase functions deploy stripe-webhook --no-verify-jwt
//   supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_...
//
// In the Stripe dashboard, register the endpoint URL:
//   https://<project>.supabase.co/functions/v1/stripe-webhook
// Events to enable:
//   payment_intent.succeeded
//   charge.dispute.created
//   charge.dispute.closed
//   transfer.created
//   account.updated

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17?target=deno";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-09-30.acacia" });
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("signature verification failed:", err);
    return new Response("bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const escrowId = pi.metadata?.escrow_id;
        if (escrowId) {
          await supabase
            .from("commission_escrow")
            .update({
              status: "held",
              funded_at: new Date().toISOString(),
              stripe_payment_intent_id: pi.id,
            })
            .eq("id", escrowId);
        }
        break;
      }
      case "charge.dispute.created": {
        const d = event.data.object as Stripe.Dispute;
        const piId = d.payment_intent as string;
        const { data: escrow } = await supabase
          .from("commission_escrow")
          .select("commission_id")
          .eq("stripe_payment_intent_id", piId)
          .maybeSingle();
        if (escrow) {
          await supabase.from("disputes").insert({
            commission_id: escrow.commission_id,
            opened_by: "patron",
            reason: d.reason ?? "Patron filed a chargeback with their bank.",
            status: "open",
            stripe_dispute_id: d.id,
          });
        }
        break;
      }
      case "charge.dispute.closed": {
        const d = event.data.object as Stripe.Dispute;
        const status =
          d.status === "won"
            ? "resolved-release"
            : d.status === "lost"
              ? "resolved-refund"
              : "resolved-mediated";
        await supabase
          .from("disputes")
          .update({
            status,
            resolved_at: new Date().toISOString(),
            resolution_note: `Stripe outcome: ${d.status}.`,
          })
          .eq("stripe_dispute_id", d.id);
        break;
      }
      case "account.updated": {
        const a = event.data.object as Stripe.Account;
        await supabase
          .from("connect_accounts")
          .update({
            status: a.details_submitted && a.charges_enabled ? "verified" : "onboarding",
            verified_at: a.charges_enabled ? new Date().toISOString() : null,
          })
          .eq("stripe_account_id", a.id);
        break;
      }
      case "transfer.created": {
        const t = event.data.object as Stripe.Transfer;
        const escrowId = t.metadata?.escrow_id;
        if (escrowId) {
          await supabase
            .from("commission_escrow")
            .update({
              status: "released",
              released_at: new Date().toISOString(),
              stripe_transfer_id: t.id,
            })
            .eq("id", escrowId);
        }
        break;
      }
      default:
        console.log("unhandled stripe event:", event.type);
    }
    return Response.json({ received: true });
  } catch (e) {
    console.error("handler failed:", e);
    return new Response("handler error", { status: 500 });
  }
});
