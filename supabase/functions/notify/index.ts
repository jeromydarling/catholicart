// Supabase edge function: notify
// ────────────────────────────────────────────────────────────────────
// Endpoint: POST /functions/v1/notify
//   Body: { event: EmailEvent }   (matches src/lib/email/types.ts)
//   Auth: requires service-role bearer (server-to-server) OR a logged-in
//         authenticated user (RLS gates the original event's row).
//
// This function:
//   1. Re-renders the template server-side from the event payload
//      (we keep the same renderer logic in src/lib/email/templates.ts
//      and ship a Deno-friendly copy here — see ./templates.ts).
//   2. Looks up email preferences per recipient and suppresses
//      unsubscribed addresses for non-transactional categories.
//   3. Sends through Resend.
//   4. Records the result in public.outbox (status='sent' or 'failed').
//
// Deploy:
//   supabase functions deploy notify --no-verify-jwt
//   supabase secrets set RESEND_API_KEY=re_...

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM = Deno.env.get("RESEND_FROM") ?? "Ars Sacra <hello@arssacra.com>";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const resend = new Resend(RESEND_API_KEY);

interface EventPayload {
  // Just the kind + event body; full templates live in ./templates.ts
  kind: string;
  [k: string]: any;
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("method not allowed", { status: 405 });
    }
    const { event } = (await req.json()) as { event: EventPayload };
    if (!event?.kind) {
      return new Response("missing event.kind", { status: 400 });
    }

    // ── Render ─────────────────────────────────────────────────────
    // Templates are duplicated in ./templates.ts so this Deno runtime
    // doesn't need to import the React side. Keep them in sync — there's
    // a CI check in scripts/check-template-parity.mjs (TODO).
    const { renderEmail } = await import("./templates.ts");
    const rendered = renderEmail(event);

    // ── Suppress unsubscribed recipients (non-transactional) ───────
    const recipients = [...rendered.recipients];
    if (rendered.category !== "transactional") {
      const emails = recipients.map((r) => r.email.toLowerCase());
      const { data: prefs } = await supabase
        .from("email_preferences")
        .select("email, unsubscribe_all, milestone, digest, marketing")
        .in("email", emails);
      const skipped = new Set(
        (prefs ?? [])
          .filter((p) => {
            if (p.unsubscribe_all) return true;
            if (rendered.category === "milestone" && !p.milestone) return true;
            if (rendered.category === "digest" && !p.digest) return true;
            if (rendered.category === "marketing" && !p.marketing) return true;
            return false;
          })
          .map((p) => p.email.toLowerCase()),
      );
      for (let i = recipients.length - 1; i >= 0; i--) {
        if (skipped.has(recipients[i].email.toLowerCase())) recipients.splice(i, 1);
      }
    }

    // ── Send via Resend ───────────────────────────────────────────
    let status: "sent" | "failed" | "skipped-unsubscribed" =
      recipients.length === 0 ? "skipped-unsubscribed" : "sent";
    let resendId: string | undefined;
    let failure: string | undefined;

    if (recipients.length > 0) {
      try {
        const result = await resend.emails.send({
          from: FROM,
          to: recipients.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)),
          subject: rendered.rendered.subject,
          html: rendered.rendered.html,
          text: rendered.rendered.text,
        });
        resendId = result.data?.id;
        if (result.error) {
          status = "failed";
          failure = result.error.message;
        }
      } catch (e) {
        status = "failed";
        failure = (e as Error).message;
      }
    }

    // ── Record in outbox (audit + dashboard) ──────────────────────
    await supabase.from("outbox").insert({
      event_kind: event.kind,
      event_payload: event,
      category: rendered.category,
      subject: rendered.rendered.subject,
      preheader: rendered.rendered.preheader,
      recipients: recipients,
      rendered_html: rendered.rendered.html,
      rendered_text: rendered.rendered.text,
      status,
      resend_id: resendId,
      failure_reason: failure,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    });

    return Response.json({ ok: status !== "failed", status, resendId, failure });
  } catch (e) {
    console.error(e);
    return new Response("internal error", { status: 500 });
  }
});
