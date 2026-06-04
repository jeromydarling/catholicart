import type { ConnectAccount } from "../types";

// Most artists are payout-verified; a couple are mid-onboarding so the
// "set up payouts" state is visible during demos.
export function seedConnect(): Record<string, ConnectAccount> {
  const verified = (slug: string, bank: string, last4: string): ConnectAccount => ({
    artistSlug: slug,
    status: "verified",
    payoutAccountBank: bank,
    payoutAccountLast4: last4,
    taxFormStatus: "on-file",
    startedAt: "2025-08-01T00:00:00.000Z",
    verifiedAt: "2025-08-04T00:00:00.000Z",
  });

  const onboarding = (slug: string): ConnectAccount => ({
    artistSlug: slug,
    status: "onboarding",
    taxFormStatus: "pending",
    startedAt: "2025-12-01T00:00:00.000Z",
  });

  return {
    "maria-chrysostom":      verified("maria-chrysostom", "First National Bank", "4421"),
    "br-andrew-of-subiaco":  verified("br-andrew-of-subiaco", "Subiaco Federal Credit Union", "0099"),
    "giovanna-solis":        verified("giovanna-solis", "Banco Santander", "5520"),
    "tobias-wren":           verified("tobias-wren", "Chase", "7702"),
    "annunciata-park":       verified("annunciata-park", "Capital One", "6118"),
    "felix-donnegan":        verified("felix-donnegan", "Wells Fargo", "0093"),
    "bartolomeu-camara":     verified("bartolomeu-camara", "Caixa Geral", "3091"),
    "sr-clare-of-avila":     verified("sr-clare-of-avila", "BBVA", "1140"),
    "henrik-aslaksen":       verified("henrik-aslaksen", "DNB", "8810"),
    "theo-marchand":         verified("theo-marchand", "Crédit Agricole", "3119"),
    "imogen-fairbairn":      onboarding("imogen-fairbairn"),
    "esteban-vega-cruz":     onboarding("esteban-vega-cruz"),
  };
}
