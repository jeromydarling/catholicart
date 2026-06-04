// Email templates (Workers/Deno-safe). Mirrors the surface area of
// src/lib/email/templates.ts but with no React or app-side imports.
// Each renderer returns recipients + category + the rendered email.

import type { Recipient, RenderedEmail, EmailCategory } from './email';

// Each renderer takes the runtime `site` (Worker env.SITE_URL); no
// hardcoded URL — keeps the workers.dev host (or future custom domain)
// as the single source of truth.
const CONTAINER = "background:#f5ebd7;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;color:#3a1418;";
const CARD = 'max-width:560px;margin:0 auto;background:#fdf7ea;border:1px solid rgba(58,20,24,0.1);border-radius:6px;overflow:hidden;';
const PAD = 'padding:32px 36px;';
const EYEBROW = "font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#a8893f;margin:0 0 14px;";
const TITLE = "font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.12;letter-spacing:-0.01em;color:#3a1418;margin:0 0 14px;";
const LEDE = "font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.55;color:#5a3a3e;margin:0 0 24px;";
const CTA = "display:inline-block;background:#6e1b1b;color:#f5ebd7;text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;letter-spacing:0.04em;padding:14px 26px;border-radius:3px;";
const RULE = 'height:1px;border:none;background:linear-gradient(to right,transparent,rgba(168,137,63,0.45) 20%,rgba(168,137,63,0.45) 80%,transparent);margin:28px 0;';
const FOOT = "font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8d6e72;";

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function unsub(email: string, site: string) {
  return `${site}/preferences?email=${encodeURIComponent(email)}`;
}

function fmtPrice(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function headline(scope: string): string {
  const first = scope.split(/\n/)[0];
  return first.length > 80 ? first.slice(0, 79) + '…' : first;
}

interface LayoutOpts {
  preheader: string;
  eyebrow?: string;
  title: string;
  lede?: string;
  body: string;
  cta?: { label: string; href: string };
  footerCategory?: string;
  unsubscribeUrl?: string;
  site: string;
}

function renderLayout(opts: LayoutOpts): string {
  const cta = opts.cta
    ? `<p style="margin:28px 0 8px"><a href="${opts.cta.href}" style="${CTA}">${esc(opts.cta.label)}</a></p>`
    : '';
  // Escape lede to prevent XSS via callers that interpolate untrusted
  // values (e.g. artist names, patron names). Callers that need
  // structural HTML in their body still get it via `opts.body` (which
  // is intentionally raw — callers there must build clean HTML).
  const lede = opts.lede ? `<p style="${LEDE}">${esc(opts.lede)}</p>` : '';
  const eyebrow = opts.eyebrow ? `<div style="${EYEBROW}">${esc(opts.eyebrow)}</div>` : '';
  const footerCategory = opts.footerCategory ? `<span>${esc(opts.footerCategory)}</span> · ` : '';
  const unsubLink = opts.unsubscribeUrl
    ? `<br/><a href="${opts.unsubscribeUrl}" style="color:#8d6e72;text-decoration:underline">Unsubscribe from these</a>`
    : '';

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(opts.title)}</title></head>
<body style="margin:0;${CONTAINER}">
<div style="display:none;font-size:1px;color:transparent;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${esc(opts.preheader)}</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%">
  <tr><td>
    <div style="${CARD}">
      <div style="${PAD}">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-family:Georgia,serif;font-size:24px;color:#3a1418">Ars Sacra</span>
          <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:0.22em;color:#a8893f;text-transform:uppercase;margin-left:6px;vertical-align:middle">Est. AD</span>
        </div>
        ${eyebrow}
        <h1 style="${TITLE}">${opts.title}</h1>
        ${lede}
        ${opts.body}
        ${cta}
        <hr style="${RULE}"/>
        <div style="${FOOT}">${footerCategory}<a href="${opts.site}" style="color:#8d6e72;text-decoration:none">${opts.site.replace(/^https?:\/\//, '')}</a>${unsubLink}</div>
      </div>
    </div>
    <div style="text-align:center;margin-top:18px;font-family:Georgia,serif;font-style:italic;font-size:13px;color:#8d6e72">Ad maiorem Dei gloriam, per pulchritudinem.</div>
  </td></tr>
</table>
</body></html>`;
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|tr|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─────────────────────────────────────────────────────────────
// Concrete templates per event kind. Add more as needed.
// ─────────────────────────────────────────────────────────────

export interface CommissionLite {
  id: string;
  scope: string;
  patron_email: string;
  patron_name: string;
  parish_or_chapel?: string;
  artist_total_usd?: number;
  platform_fee_usd?: number;
  total_due_usd?: number;
  platform_fee_pct: number;
  artist_quote_note?: string;
}

export function quoteSentToPatron(
  site: string,
  c: CommissionLite,
  artistName: string,
): { recipients: Recipient[]; category: EmailCategory; rendered: RenderedEmail } {
  // Header injection defense: strip CR/LF, cap length.
  const safeArtist = artistName.replace(/[\r\n]/g, ' ').slice(0, 120);
  const subject = `${safeArtist} sent a quote — ${fmtPrice(c.total_due_usd ?? 0)}`;
  const preheader = 'Review the quote and fund the deposit to begin.';
  const html = renderLayout({
    site,
    preheader,
    eyebrow: 'Quote received',
    title: 'The artist has replied.',
    lede: `${safeArtist} sent a quote for your commission. Read it, then fund the deposit to begin the work.`,
    body:
      (c.artist_quote_note
        ? `<p style="font-family:Georgia,serif;font-style:italic;font-size:16px;line-height:1.6;color:#3a1418;margin:20px 0 8px;border-left:3px solid #a8893f;padding-left:14px">${esc(c.artist_quote_note)}</p>`
        : '') +
      `<table role="presentation" style="width:100%;margin-top:18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px">
<tr><td style="color:#8d6e72;padding:6px 0">Artist receives</td><td style="text-align:right;color:#3a1418">${fmtPrice(c.artist_total_usd ?? 0)}</td></tr>
<tr><td style="color:#8d6e72;padding:6px 0">Platform fee · ${Math.round(c.platform_fee_pct * 100)}%</td><td style="text-align:right;color:#8d6e72">${fmtPrice(c.platform_fee_usd ?? 0)}</td></tr>
<tr><td style="color:#3a1418;padding:8px 0 0;border-top:1px solid rgba(58,20,24,0.1)"><strong>Total</strong></td><td style="text-align:right;color:#6e1b1b;padding-top:8px;border-top:1px solid rgba(58,20,24,0.1)"><strong>${fmtPrice(c.total_due_usd ?? 0)}</strong></td></tr>
</table>`,
    cta: { label: 'Review and fund the deposit', href: `${site}/workspace/${c.id}` },
    footerCategory: 'Quote',
    unsubscribeUrl: unsub(c.patron_email, site),
  });
  return {
    // The patron's own commission quote is transactional — unsubscribing
    // from "milestone" mail (catch-up on other people's commissions)
    // shouldn't black-hole the response to their own request.
    recipients: [{ email: c.patron_email, name: c.patron_name, role: 'patron' }],
    category: 'transactional',
    rendered: { subject, preheader, html, text: htmlToText(html) },
  };
}

export function magicLinkToVerifier(
  site: string,
  to: { email: string; name?: string },
  link: string,
  isVerification = false,
): { recipients: Recipient[]; category: EmailCategory; rendered: RenderedEmail } {
  const subject = isVerification
    ? 'Endorsement requested — Ars Sacra'
    : 'Sign in to Ars Sacra';
  const preheader = isVerification
    ? 'A guild artist has named you as a witness.'
    : 'Click the link to sign in. Expires in 30 minutes.';
  const html = renderLayout({
    site,
    preheader,
    eyebrow: isVerification ? 'Endorsement request' : 'Sign in',
    title: isVerification ? 'Would you endorse an artist?' : 'Sign in to Ars Sacra',
    lede: isVerification
      ? "We don't accept artists without a witness from their parish. One click will let you endorse, decline, or ask for a conversation. You're under no obligation."
      : 'Use the button below to sign in. This link expires in 30 minutes and can only be used once.',
    body: '',
    cta: { label: isVerification ? 'Open the endorsement page' : 'Sign in', href: link },
    footerCategory: isVerification ? 'Endorsement' : 'Sign in',
  });
  return {
    recipients: [{ email: to.email, name: to.name, role: isVerification ? 'priest' : 'patron' }],
    category: 'transactional',
    rendered: { subject, preheader, html, text: htmlToText(html) },
  };
}

export function welcomeSubscriber(
  site: string,
  email: string,
): { recipients: Recipient[]; category: EmailCategory; rendered: RenderedEmail } {
  const subject = 'Welcome to the Beauty Manifesto';
  const preheader = 'The next issue lands at this address.';
  const html = renderLayout({
    site,
    preheader,
    eyebrow: 'The Beauty Manifesto · Quarterly',
    title: "You're on the list.",
    lede: 'Four issues a year. Nothing else.',
    body: '',
    cta: { label: 'Read the current issue', href: `${site}/journal` },
    footerCategory: 'Subscription',
    unsubscribeUrl: unsub(email, site),
  });
  return {
    recipients: [{ email, role: 'subscriber' }],
    category: 'marketing',
    rendered: { subject, preheader, html, text: htmlToText(html) },
  };
}
