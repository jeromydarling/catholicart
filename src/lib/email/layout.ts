// Shared email chrome. Plain HTML strings with inlined styles so they
// render across email clients. Stays small and accessible.

import { brand } from "../../data/brand";

export interface LayoutOpts {
  preheader: string;
  // Eyebrow text shown above the title (uppercase, gold)
  eyebrow?: string;
  // Big serif headline
  title: string;
  // Optional lede paragraph
  lede?: string;
  // Body HTML (already rendered)
  body: string;
  // Single primary CTA: { label, href }
  cta?: { label: string; href: string };
  // Footer category label (Milestone update / Endorsement / etc.)
  footerCategory?: string;
  // Unsubscribe link visibility
  unsubscribeUrl?: string;
}

const CONTAINER = "background:#f5ebd7;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;color:#3a1418;";
const CARD = "max-width:560px;margin:0 auto;background:#fdf7ea;border:1px solid rgba(58,20,24,0.1);border-radius:6px;overflow:hidden;";
const PAD = "padding:32px 36px;";
const EYEBROW = "font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#a8893f;margin:0 0 14px;";
const TITLE = "font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.12;letter-spacing:-0.01em;color:#3a1418;margin:0 0 14px;";
const LEDE = "font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.55;color:#5a3a3e;margin:0 0 24px;";
const RULE = "height:1px;border:none;background:linear-gradient(to right,transparent,rgba(168,137,63,0.45) 20%,rgba(168,137,63,0.45) 80%,transparent);margin:28px 0;";
const FOOT = "font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8d6e72;";
const CTA = "display:inline-block;background:#6e1b1b;color:#f5ebd7;text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;letter-spacing:0.04em;padding:14px 26px;border-radius:3px;";

export function renderLayout(opts: LayoutOpts): string {
  const cta = opts.cta
    ? `<p style="margin:28px 0 8px"><a href="${opts.cta.href}" style="${CTA}">${escape(opts.cta.label)}</a></p>`
    : "";
  const lede = opts.lede ? `<p style="${LEDE}">${opts.lede}</p>` : "";
  const eyebrow = opts.eyebrow ? `<div style="${EYEBROW}">${escape(opts.eyebrow)}</div>` : "";
  const footerCategory = opts.footerCategory
    ? `<span>${escape(opts.footerCategory)}</span> · `
    : "";
  const unsub = opts.unsubscribeUrl
    ? `<br/><a href="${opts.unsubscribeUrl}" style="color:#8d6e72;text-decoration:underline">Unsubscribe from these</a>`
    : "";

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escape(opts.title)}</title></head>
<body style="margin:0;${CONTAINER}">
<!-- pre-header (hidden in clients that support it) -->
<div style="display:none;font-size:1px;color:transparent;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escape(opts.preheader)}</div>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%">
  <tr><td>
    <div style="${CARD}">
      <div style="${PAD}">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:24px;letter-spacing:-0.01em;color:#3a1418">${escape(brand.name)}</span>
          <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:10px;letter-spacing:0.22em;color:#a8893f;text-transform:uppercase;margin-left:6px;vertical-align:middle">Est. AD</span>
        </div>
        ${eyebrow}
        <h1 style="${TITLE}">${opts.title}</h1>
        ${lede}
        ${opts.body}
        ${cta}
        <hr style="${RULE}"/>
        <div style="${FOOT}">${footerCategory}<a href="https://arssacra.local" style="color:#8d6e72;text-decoration:none">arssacra.local</a>${unsub}</div>
      </div>
    </div>
    <div style="text-align:center;margin-top:18px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:13px;color:#8d6e72">${escape(brand.motto)}</div>
  </td></tr>
</table>
</body></html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Plain-text fallback. Strip tags + collapse whitespace.
export function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|tr|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
