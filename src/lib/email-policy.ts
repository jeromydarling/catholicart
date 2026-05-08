// Email-domain policy for verifier emails.
//
// Rule: free webmail (gmail, hotmail, yahoo, etc.) is accepted but downgrades
// the verification path so a diocesan-chancery confirmation is required
// before the endorsement counts as full.

const FREE_WEBMAIL_DOMAINS = new Set<string>([
  // Google
  "gmail.com",
  "googlemail.com",
  // Microsoft
  "hotmail.com",
  "hotmail.co.uk",
  "hotmail.fr",
  "hotmail.de",
  "outlook.com",
  "outlook.co.uk",
  "live.com",
  "live.co.uk",
  "msn.com",
  // Yahoo
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.fr",
  "yahoo.it",
  "yahoo.es",
  "yahoo.ca",
  "yahoo.com.br",
  "ymail.com",
  "rocketmail.com",
  // Apple
  "icloud.com",
  "me.com",
  "mac.com",
  // AOL
  "aol.com",
  "aim.com",
  // Proton, GMX, etc.
  "protonmail.com",
  "proton.me",
  "pm.me",
  "gmx.com",
  "gmx.de",
  "gmx.net",
  "mail.com",
  "fastmail.com",
  "fastmail.fm",
  "yandex.com",
  "yandex.ru",
  "zoho.com",
  "tutanota.com",
  "hey.com",
  // US ISP webmail
  "comcast.net",
  "verizon.net",
  "att.net",
  "sbcglobal.net",
  "cox.net",
  "bellsouth.net",
  "earthlink.net",
  "charter.net",
]);

export interface EmailClassification {
  valid: boolean;
  domain: string;
  isFreeWebmail: boolean;
  reason?: string;
}

export function classifyEmail(email: string): EmailClassification {
  const norm = (email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm)) {
    return {
      valid: false,
      domain: "",
      isFreeWebmail: false,
      reason: "That doesn't look like a valid email address.",
    };
  }
  const domain = norm.split("@")[1];
  return {
    valid: true,
    domain,
    isFreeWebmail: FREE_WEBMAIL_DOMAINS.has(domain),
  };
}

// Heuristic: does the domain look like an institutional Catholic email?
// Used as a positive signal in admin-side review, never to bypass blocklist.
export function looksInstitutional(domain: string): boolean {
  if (!domain) return false;
  return (
    /\b(parish|catholic|diocese|archdiocese|abbey|monastery|seminary)\b/i.test(
      domain,
    ) ||
    /\b(saint|st-?[\w-]+)/i.test(domain) ||
    /\.(org|edu|cathedral)\b/i.test(domain)
  );
}
