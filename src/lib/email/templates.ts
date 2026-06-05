// Per-event email templates. Each returns subject/preheader/HTML/text
// plus the recipient list. Templates are pure functions; the notify()
// wrapper handles outbox + Resend dispatch.

import type {
  EmailEvent,
  Recipient,
  RenderedEmail,
  EmailCategory,
} from "./types";
import type { Commission } from "../../types";
import { renderLayout, htmlToText } from "./layout";
import { formatPrice } from "../utils";

const BASE = "https://locavit.local";

export interface Rendered {
  recipients: Recipient[];
  category: EmailCategory;
  rendered: RenderedEmail;
}

function workspaceUrl(c: Commission) {
  return `${BASE}/workspace/${c.id}`;
}

function unsubFor(email: string) {
  return `${BASE}/preferences?email=${encodeURIComponent(email)}`;
}

function patron(c: Commission): Recipient {
  return { email: c.patronEmail, name: c.patronName, role: "patron" };
}

// Artist email is not in the Commission model in the prototype; we
// fabricate one deterministically from the slug. In production the
// commission row will carry the artist's user_id and we'll look it up.
function artist(c: Commission, name?: string): Recipient {
  return {
    email: `${c.artistSlug}@artists.locavit.local`,
    name: name ?? c.artistSlug,
    role: "artist",
  };
}

function commonFooter(c: Commission): string {
  return `<div style="margin-top:24px;padding:14px 18px;background:rgba(168,137,63,0.08);border-left:3px solid #a8893f;font-family:Georgia,serif;font-size:14px;color:#5a3a3e;line-height:1.5">
<strong style="color:#3a1418">${escapeHtml(headline(c))}</strong><br/>
${c.parishOrChapel ? `<span style="color:#8d6e72">${escapeHtml(c.parishOrChapel)}</span>` : ""}
</div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function headline(c: Commission): string {
  const first = c.scope.split(/\n/)[0];
  return first.length > 80 ? first.slice(0, 79) + "…" : first;
}

// ─────────────────────────────────────────────────────────────
// Event renderer
// ─────────────────────────────────────────────────────────────
export function renderEmail(e: EmailEvent): Rendered {
  switch (e.kind) {
    case "commission.created": {
      const c = e.commission;
      const subject = `New commission request from ${c.patronName}`;
      const preheader = headline(c);
      const html = renderLayout({
        preheader,
        eyebrow: "A new request",
        title: `${c.patronName} would like you to make something.`,
        lede: `Read their description below, then send a quote when you're ready. You're under no obligation to accept.`,
        body: commonFooter(c) +
          `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#3a1418;margin:20px 0 8px;white-space:pre-line">${escapeHtml(c.scope)}</p>` +
          (c.feastDeadline
            ? `<p style="font-family:Georgia,serif;font-style:italic;color:#5a3a3e">For <strong>${escapeHtml(c.feastDeadline.name)}</strong> · ${escapeHtml(c.feastDeadline.date)}</p>`
            : ""),
        cta: { label: "Reply with a quote", href: workspaceUrl(c) },
        footerCategory: "Commission",
        unsubscribeUrl: unsubFor(artist(e.commission).email),
      });
      return {
        recipients: [artist(c)],
        category: "milestone",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    case "commission.quoted": {
      const c = e.commission;
      const subject = `${e.artist?.name ?? "Artist"} sent a quote — ${formatPrice(c.totalDueUsd ?? 0)}`;
      const preheader = `Review the quote and fund the deposit to begin.`;
      const html = renderLayout({
        preheader,
        eyebrow: "Quote received",
        title: "The artist has replied.",
        lede: `${e.artist?.name ?? "The artist"} sent a quote for your commission. Read it, then fund the deposit to begin the work.`,
        body: commonFooter(c) +
          (c.artistQuoteNote
            ? `<p style="font-family:Georgia,serif;font-style:italic;font-size:16px;line-height:1.6;color:#3a1418;margin:20px 0 8px;border-left:3px solid #a8893f;padding-left:14px">${escapeHtml(c.artistQuoteNote)}</p>`
            : "") +
          `<table role="presentation" style="width:100%;margin-top:18px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px">
<tr><td style="color:#8d6e72;padding:6px 0">Artist receives</td><td style="text-align:right;color:#3a1418">${formatPrice(c.artistTotalUsd ?? 0)}</td></tr>
<tr><td style="color:#8d6e72;padding:6px 0">Platform fee · ${Math.round(c.platformFeePct * 100)}%</td><td style="text-align:right;color:#8d6e72">${formatPrice(c.platformFeeUsd ?? 0)}</td></tr>
<tr><td style="color:#3a1418;padding:8px 0 0;border-top:1px solid rgba(58,20,24,0.1)"><strong>Total</strong></td><td style="text-align:right;color:#6e1b1b;padding-top:8px;border-top:1px solid rgba(58,20,24,0.1)"><strong>${formatPrice(c.totalDueUsd ?? 0)}</strong></td></tr>
</table>`,
        cta: { label: "Review and fund the deposit", href: workspaceUrl(c) },
        footerCategory: "Quote",
        unsubscribeUrl: unsubFor(c.patronEmail),
      });
      return {
        recipients: [patron(c)],
        category: "milestone",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    case "commission.funded": {
      const c = e.commission;
      const stageLabel = e.stage === "deposit" ? "Deposit" : e.stage === "midpoint" ? "Midpoint" : "Final";
      const milestone = c.escrow.find((m) => m.stage === e.stage);
      const subject = `${stageLabel} funded — ${formatPrice(milestone?.amountUsd ?? 0)} in escrow`;
      const preheader = `Funds are held. You can begin / continue the work.`;
      const html = renderLayout({
        preheader,
        eyebrow: `${stageLabel} held in escrow`,
        title: e.stage === "deposit" ? "The work begins." : `${stageLabel} held.`,
        lede: e.stage === "deposit"
          ? `${c.patronName} funded the deposit. ${formatPrice(milestone?.amountUsd ?? 0)} is held in escrow and will release when you complete this phase.`
          : `${c.patronName} funded the ${e.stage} milestone — ${formatPrice(milestone?.amountUsd ?? 0)} held.`,
        body: commonFooter(c),
        cta: { label: "Open the workspace", href: workspaceUrl(c) },
        footerCategory: "Milestone",
        unsubscribeUrl: unsubFor(artist(c).email),
      });
      return {
        recipients: [artist(c, e.artist?.name)],
        category: "milestone",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    case "commission.released": {
      const c = e.commission;
      const stageLabel = e.stage === "deposit" ? "Deposit" : e.stage === "midpoint" ? "Midpoint" : "Final";
      const milestone = c.escrow.find((m) => m.stage === e.stage);
      const subject = `${formatPrice(milestone?.amountUsd ?? 0)} released — ${stageLabel}`;
      const preheader = `Funds are on the way to your account.`;
      const html = renderLayout({
        preheader,
        eyebrow: "Payout released",
        title: e.stage === "final" ? "Commission complete." : `${stageLabel} released.`,
        lede: e.stage === "final"
          ? `${c.patronName} released the final payment. The commission is now complete — a certificate of authenticity has been issued.`
          : `${c.patronName} released the ${e.stage} milestone. ${formatPrice(milestone?.amountUsd ?? 0)} will deposit to your account in 2 business days.`,
        body: commonFooter(c),
        cta: e.stage === "final"
          ? { label: "View the certificate", href: `${BASE}/certificate/${c.id}` }
          : { label: "Continue the work", href: workspaceUrl(c) },
        footerCategory: "Payout",
        unsubscribeUrl: unsubFor(artist(c).email),
      });
      return {
        recipients: [artist(c, e.artist?.name)],
        category: "transactional",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    case "commission.midpoint": {
      const c = e.commission;
      const m = c.escrow.find((x) => x.stage === "midpoint");
      const subject = `Midpoint review — ${headline(c)}`;
      const preheader = `${e.artist?.name ?? "The artist"} has reached the midpoint and asks for your eye.`;
      const html = renderLayout({
        preheader,
        eyebrow: "Midpoint reached",
        title: `${e.artist?.name ?? "The artist"} asks for your review.`,
        lede: `Open the workspace, look at the studio update, then release the midpoint payment when you're satisfied. ${formatPrice(m?.amountUsd ?? 0)} will flow to the artist.`,
        body: commonFooter(c),
        cta: { label: "Review the midpoint", href: workspaceUrl(c) },
        footerCategory: "Milestone",
        unsubscribeUrl: unsubFor(c.patronEmail),
      });
      return {
        recipients: [patron(c)],
        category: "milestone",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    case "commission.final": {
      const c = e.commission;
      const m = c.escrow.find((x) => x.stage === "final");
      const subject = `Final review — ${headline(c)}`;
      const preheader = `The work is complete. Release the final payment when you're satisfied.`;
      const html = renderLayout({
        preheader,
        eyebrow: "Ready for final release",
        title: "The work is finished.",
        lede: `${e.artist?.name ?? "The artist"} has marked the work complete. Inspect the studio thread, and release ${formatPrice(m?.amountUsd ?? 0)} when ready. A certificate of authenticity will be issued.`,
        body: commonFooter(c),
        cta: { label: "Inspect and release", href: workspaceUrl(c) },
        footerCategory: "Milestone",
        unsubscribeUrl: unsubFor(c.patronEmail),
      });
      return {
        recipients: [patron(c)],
        category: "milestone",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    case "commission.delivered": {
      const c = e.commission;
      const subject = `Delivered — your certificate is ready`;
      const preheader = `Print, frame, archive. The certificate carries a unique serial recorded in The Ledger.`;
      const html = renderLayout({
        preheader,
        eyebrow: "Delivered",
        title: "Your commission has been delivered.",
        lede: `Thank you for commissioning. The work is yours; the artist has been paid in full; a certificate of authenticity has been issued and entered into The Ledger.`,
        body: commonFooter(c) +
          (c.certificate
            ? `<p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#8d6e72;margin-top:18px">Serial · ${escapeHtml(c.certificate.serial)}</p>`
            : ""),
        cta: { label: "View the certificate", href: `${BASE}/certificate/${c.id}` },
        footerCategory: "Delivered",
        unsubscribeUrl: unsubFor(c.patronEmail),
      });
      return {
        recipients: [patron(c), artist(c, e.artist?.name)],
        category: "transactional",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    case "commission.blessed": {
      const c = e.commission;
      const subject = `Blessing recorded — ${headline(c)}`;
      const preheader = `The work has been blessed and is in service.`;
      const html = renderLayout({
        preheader,
        eyebrow: "Blessing recorded",
        title: "Delivered. Blessed. In service.",
        lede: c.blessing
          ? `Blessed by <strong>${escapeHtml(c.blessing.recordedBy)}</strong>${c.blessing.parishOrChapel ? ` at <em>${escapeHtml(c.blessing.parishOrChapel)}</em>` : ""}.`
          : `The blessing has been recorded.`,
        body: commonFooter(c),
        cta: { label: "View the record", href: `${BASE}/certificate/${c.id}` },
        footerCategory: "Blessing",
        unsubscribeUrl: unsubFor(c.patronEmail),
      });
      return {
        recipients: [patron(c), artist(c, e.artist?.name)],
        category: "milestone",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    case "commission.cancelled": {
      const c = e.commission;
      const subject = `Cancelled — ${headline(c)}`;
      const preheader = `Held funds have been refunded.`;
      const html = renderLayout({
        preheader,
        eyebrow: "Cancelled",
        title: "The commission has been cancelled.",
        lede: `Any held funds have been refunded to the patron. The studio thread remains accessible for your records.`,
        body: commonFooter(c),
        cta: { label: "Open the record", href: workspaceUrl(c) },
        footerCategory: "Cancelled",
        unsubscribeUrl: unsubFor(c.patronEmail),
      });
      return {
        recipients: [patron(c), artist(c, e.artist?.name)],
        category: "transactional",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    case "commission.wip": {
      const c = e.commission;
      const subject = `Studio update — ${headline(c)}`;
      const preheader = e.caption;
      const html = renderLayout({
        preheader,
        eyebrow: "Studio update",
        title: "The artist sent a studio update.",
        body: commonFooter(c) +
          `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#3a1418;margin:18px 0 8px;font-style:italic">"${escapeHtml(e.caption)}"</p>`,
        cta: { label: "See the update", href: workspaceUrl(c) },
        footerCategory: "Studio diary",
        unsubscribeUrl: unsubFor(c.patronEmail),
      });
      return {
        recipients: [patron(c)],
        category: "milestone",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    case "commission.message": {
      const c = e.commission;
      const recipient = e.fromRole === "patron" ? artist(c, e.artist?.name) : patron(c);
      const fromName = e.fromRole === "patron" ? c.patronName : e.artist?.name ?? "The artist";
      const subject = `${fromName} sent a message`;
      const preheader = e.body.slice(0, 90);
      const html = renderLayout({
        preheader,
        eyebrow: "Message",
        title: `${fromName} replied.`,
        body: commonFooter(c) +
          `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#3a1418;margin:18px 0 8px;white-space:pre-line">${escapeHtml(e.body)}</p>`,
        cta: { label: "Open the thread", href: workspaceUrl(c) },
        footerCategory: "Message",
        unsubscribeUrl: unsubFor(recipient.email),
      });
      return {
        recipients: [recipient],
        category: "milestone",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    // ── Pastor endorsement ───────────────────────────────────
    case "verification.requested": {
      const v = e.verification;
      const role = v.role === "religious-superior" ? "Superior" : v.role === "chancery" ? "Chancellor" : "Father";
      const subject = `Endorsement requested — Locavit`;
      const preheader = `A guild artist has named you as a witness.`;
      const html = renderLayout({
        preheader,
        eyebrow: "Endorsement request",
        title: `${role}, would you endorse an artist?`,
        lede: `An artist who claims to be in your community has applied to the Locavit guild. We don't accept applications without a witness. One click will let you endorse, decline, or ask for a conversation. You're under no obligation.`,
        body: `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.6;color:#3a1418">The artist named <strong>${escapeHtml(v.parishOrCommunity)}</strong> as their parish or community.</p>`,
        cta: { label: "Open the endorsement page", href: `${BASE}/verify/${v.token}` },
        footerCategory: "Endorsement",
      });
      return {
        recipients: [{ email: v.verifierEmail, name: v.verifierName, role: "priest" }],
        category: "transactional",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    case "verification.endorsed": {
      const v = e.verification;
      const subject = `Endorsed — your guild profile is one step closer`;
      const preheader = `Your verifier signed off.`;
      const html = renderLayout({
        preheader,
        eyebrow: "Endorsed",
        title: "You've been endorsed.",
        lede: v.verifierEmailIsFreeWebmail
          ? `${escapeHtml(v.verifierName)} endorsed your application. Because their email is on a free webmail provider, we'll also confirm with the diocesan chancery before your profile goes live.`
          : `${escapeHtml(v.verifierName)} endorsed your application. Your profile will go live on the guild within 24 hours.`,
        body: "",
        cta: { label: "Open your dashboard", href: `${BASE}/dashboard` },
        footerCategory: "Endorsement",
      });
      return {
        recipients: [{ email: "applicant@locavit.local", role: "artist" }],
        category: "transactional",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    case "verification.declined": {
      const subject = `Endorsement declined`;
      const preheader = `Your verifier did not sign off.`;
      const html = renderLayout({
        preheader,
        eyebrow: "Endorsement declined",
        title: "Your verifier declined.",
        lede: `If you believe there's been a misunderstanding, you may re-apply with a different verifier. Reach out if you'd like a guild reader to look into this.`,
        body: "",
        footerCategory: "Endorsement",
      });
      return {
        recipients: [{ email: "applicant@locavit.local", role: "artist" }],
        category: "transactional",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    case "verification.chancery": {
      const v = e.verification;
      const subject = `Chancery confirmation requested — Locavit`;
      const preheader = `A guild artist needs your office to confirm a parish endorsement.`;
      const html = renderLayout({
        preheader,
        eyebrow: "Chancery request",
        title: "Could the chancery confirm an artist's parish?",
        lede: `An artist who claims to be in ${escapeHtml(v.parishOrCommunity)} was endorsed by ${escapeHtml(v.verifierName)}. Because that verifier's email is on a free webmail provider, we'd like the chancery to confirm before the artist's profile goes live.`,
        body: "",
        cta: { label: "Open the chancery page", href: `${BASE}/chancery/${v.chanceryToken}` },
        footerCategory: "Endorsement",
      });
      return {
        recipients: [{ email: v.chanceryEmail ?? "chancery@unknown.local", role: "chancery" }],
        category: "transactional",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    case "verification.confirmed": {
      const subject = `Endorsement confirmed — you're live`;
      const preheader = `The chancery confirmed. Your profile is now live on the guild.`;
      const html = renderLayout({
        preheader,
        eyebrow: "Endorsed · chancery confirmed",
        title: "Your profile is live.",
        lede: `The chancery confirmed your endorsement. Re-confirmation in 12 months; your verifier may revoke at any time.`,
        body: "",
        cta: { label: "Open your dashboard", href: `${BASE}/dashboard` },
        footerCategory: "Endorsement",
      });
      return {
        recipients: [{ email: "applicant@locavit.local", role: "artist" }],
        category: "transactional",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }

    case "subscribe.journal": {
      const subject = `Welcome to the Beauty Manifesto`;
      const preheader = `The next issue lands at this address.`;
      const html = renderLayout({
        preheader,
        eyebrow: "The Beauty Manifesto · Quarterly",
        title: "You're on the list.",
        lede: `Four issues a year. Nothing else. The next one — On Looking at the Body — lands at this address in April.`,
        body: "",
        cta: { label: "Read the current issue", href: `${BASE}/journal` },
        footerCategory: "Subscription",
        unsubscribeUrl: unsubFor(e.email),
      });
      return {
        recipients: [{ email: e.email, role: "subscriber" }],
        category: "marketing",
        rendered: { subject, preheader, html, text: htmlToText(html) },
      };
    }
  }
}
