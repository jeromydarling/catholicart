// Deno-friendly copy of the email templates. Mirrors the surface area
// of src/lib/email/templates.ts. Keep these in sync.
//
// We don't import the React-side templates directly because they pull
// in app-side helpers; this Deno runtime needs only the rendering logic.

// deno-lint-ignore-file no-explicit-any

const SITE = Deno.env.get("ARS_SACRA_SITE") ?? "https://arssacra.com";

interface Recipient {
  email: string;
  name?: string;
  role: string;
}

interface RenderedEmail {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

export interface Rendered {
  recipients: Recipient[];
  category: "transactional" | "milestone" | "digest" | "marketing";
  rendered: RenderedEmail;
}

const CONTAINER = "background:#f5ebd7;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;color:#3a1418;";
const CARD = "max-width:560px;margin:0 auto;background:#fdf7ea;border:1px solid rgba(58,20,24,0.1);border-radius:6px;overflow:hidden;";
const PAD = "padding:32px 36px;";
const EYEBROW = "font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#a8893f;margin:0 0 14px;";
const TITLE = "font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.12;letter-spacing:-0.01em;color:#3a1418;margin:0 0 14px;";
const LEDE = "font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.55;color:#5a3a3e;margin:0 0 24px;";
const CTA = "display:inline-block;background:#6e1b1b;color:#f5ebd7;text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;letter-spacing:0.04em;padding:14px 26px;border-radius:3px;";
const RULE = "height:1px;border:none;background:linear-gradient(to right,transparent,rgba(168,137,63,0.45) 20%,rgba(168,137,63,0.45) 80%,transparent);margin:28px 0;";
const FOOT = "font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8d6e72;";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderLayout(opts: {
  preheader: string;
  eyebrow?: string;
  title: string;
  lede?: string;
  body: string;
  cta?: { label: string; href: string };
  footerCategory?: string;
  unsubscribeUrl?: string;
}): string {
  const cta = opts.cta
    ? `<p style="margin:28px 0 8px"><a href="${opts.cta.href}" style="${CTA}">${esc(opts.cta.label)}</a></p>`
    : "";
  const lede = opts.lede ? `<p style="${LEDE}">${opts.lede}</p>` : "";
  const eyebrow = opts.eyebrow ? `<div style="${EYEBROW}">${esc(opts.eyebrow)}</div>` : "";
  const footerCategory = opts.footerCategory ? `<span>${esc(opts.footerCategory)}</span> · ` : "";
  const unsub = opts.unsubscribeUrl
    ? `<br/><a href="${opts.unsubscribeUrl}" style="color:#8d6e72;text-decoration:underline">Unsubscribe from these</a>`
    : "";

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(opts.title)}</title></head>
<body style="margin:0;${CONTAINER}">
<div style="display:none;font-size:1px;color:transparent;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${esc(opts.preheader)}</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%">
  <tr><td>
    <div style="${CARD}">
      <div style="${PAD}">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:24px;letter-spacing:-0.01em;color:#3a1418">Ars Sacra</span>
          <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:0.22em;color:#a8893f;text-transform:uppercase;margin-left:6px;vertical-align:middle">Est. AD</span>
        </div>
        ${eyebrow}
        <h1 style="${TITLE}">${opts.title}</h1>
        ${lede}
        ${opts.body}
        ${cta}
        <hr style="${RULE}"/>
        <div style="${FOOT}">${footerCategory}<a href="${SITE}" style="color:#8d6e72;text-decoration:none">arssacra.com</a>${unsub}</div>
      </div>
    </div>
    <div style="text-align:center;margin-top:18px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:13px;color:#8d6e72">Ad maiorem Dei gloriam, per pulchritudinem.</div>
  </td></tr>
</table>
</body></html>`;
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|tr|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function unsubFor(email: string) {
  return `${SITE}/preferences?email=${encodeURIComponent(email)}`;
}

function headline(scope: string): string {
  const first = scope.split(/\n/)[0];
  return first.length > 80 ? first.slice(0, 79) + "…" : first;
}

// Minimal renderer covering the most common event kinds. The React-side
// templates are the source of truth; this is a reduced server-side
// re-implementation for the events that need to go out as real email.
// Add more cases as needed.
export function renderEmail(event: any): Rendered {
  const commission = event.commission;
  const artist = event.artist;

  switch (event.kind) {
    case "commission.quoted": {
      const subject = `${artist?.name ?? "Artist"} sent a quote — ${formatPrice(commission?.totalDueUsd ?? 0)}`;
      const preheader = "Review the quote and fund the deposit to begin.";
      const html = renderLayout({
        preheader,
        eyebrow: "Quote received",
        title: "The artist has replied.",
        lede: `${artist?.name ?? "The artist"} sent a quote for your commission. Read it, then fund the deposit to begin the work.`,
        body: commission?.artistQuoteNote
          ? `<p style="font-family:Georgia,serif;font-style:italic;font-size:16px;line-height:1.6;color:#3a1418;margin:20px 0 8px;border-left:3px solid #a8893f;padding-left:14px">${esc(commission.artistQuoteNote)}</p>`
          : "",
        cta: { label: "Review and fund the deposit", href: `${SITE}/workspace/${commission.id}` },
        footerCategory: "Quote",
        unsubscribeUrl: unsubFor(commission.patronEmail),
      });
      return {
        recipients: [{ email: commission.patronEmail, name: commission.patronName, role: "patron" }],
        category: "milestone",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    case "commission.midpoint": {
      const subject = `Midpoint review — ${headline(commission.scope)}`;
      const preheader = `${artist?.name ?? "The artist"} has reached the midpoint and asks for your eye.`;
      const html = renderLayout({
        preheader,
        eyebrow: "Midpoint reached",
        title: `${artist?.name ?? "The artist"} asks for your review.`,
        lede: "Open the workspace, look at the studio update, then release the midpoint payment when you're satisfied.",
        body: "",
        cta: { label: "Review the midpoint", href: `${SITE}/workspace/${commission.id}` },
        footerCategory: "Milestone",
        unsubscribeUrl: unsubFor(commission.patronEmail),
      });
      return {
        recipients: [{ email: commission.patronEmail, name: commission.patronName, role: "patron" }],
        category: "milestone",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    case "verification.requested": {
      const v = event.verification;
      const role = v.role === "religious-superior" ? "Superior" : v.role === "chancery" ? "Chancellor" : "Father";
      const subject = "Endorsement requested — Ars Sacra";
      const preheader = "A guild artist has named you as a witness.";
      const html = renderLayout({
        preheader,
        eyebrow: "Endorsement request",
        title: `${role}, would you endorse an artist?`,
        lede: "An artist who claims to be in your community has applied to the Ars Sacra guild. We don't accept applications without a witness. One click will let you endorse, decline, or ask for a conversation. You're under no obligation.",
        body: `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#3a1418">The artist named <strong>${esc(v.parishOrCommunity)}</strong> as their parish or community.</p>`,
        cta: { label: "Open the endorsement page", href: `${SITE}/verify/${v.token}` },
        footerCategory: "Endorsement",
      });
      return {
        recipients: [{ email: v.verifierEmail, name: v.verifierName, role: "priest" }],
        category: "transactional",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    default: {
      // Generic fallback so unknown events still send a usable email.
      const subject = `Ars Sacra update`;
      const preheader = `An update from Ars Sacra.`;
      const html = renderLayout({
        preheader,
        eyebrow: "Update",
        title: "Something happened on your commission.",
        body: `<p style="font-family:Georgia,serif;font-size:16px">Open your dashboard for details.</p>`,
        cta: { label: "Open dashboard", href: `${SITE}/dashboard` },
        footerCategory: "Update",
      });
      const to = commission?.patronEmail ?? event.email ?? "operator@arssacra.com";
      return {
        recipients: [{ email: to, role: "patron" }],
        category: "milestone",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }
  }
}
