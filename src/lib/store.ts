import * as React from "react";
import type {
  Commission,
  CommissionMessage,
  ConnectAccount,
  ConnectStatus,
  EscrowStage,
  Verification,
  VerifierRole,
  WipUpdate,
  BlessingRecord,
} from "../types";
import { classifyEmail } from "./email-policy";
import { PLATFORM_FEE_PCT, computePricing } from "./pricing";
import { seedCommissions } from "../data/seed-commissions";
import { seedConnect } from "../data/seed-connect";

interface SignedUpArtist {
  name: string;
  email: string;
  verificationToken?: string;
}

export interface CreateCommissionInput {
  artistSlug: string;
  patronName: string;
  patronEmail: string;
  category: Commission["category"];
  setting: string;
  scope: string;
  preferredDeadline?: string;
  feastDeadline?: Commission["feastDeadline"];
  patronSaint?: string;
  parishOrChapel?: string;
  diocese?: string;
}

export interface VerificationInput {
  role: VerifierRole;
  verifierName: string;
  verifierEmail: string;
  parishOrCommunity: string;
  parishWebsite?: string;
  diocese?: string;
  chanceryEmail?: string;
}

interface StoreState {
  // Commissions (full lifecycle)
  commissions: Commission[];
  getCommission: (id: string) => Commission | null;
  createCommission: (input: CreateCommissionInput) => Commission;
  artistQuote: (
    id: string,
    artistTotalUsd: number,
    quoteNote: string,
    platformFeePct?: number,
  ) => Commission | null;
  fundEscrow: (id: string, stage: EscrowStage) => Commission | null;
  releaseMilestone: (id: string, stage: EscrowStage) => Commission | null;
  artistMarkMidpoint: (id: string, body: string) => Commission | null;
  artistMarkFinal: (id: string, body: string, title?: string) => Commission | null;
  addMessage: (
    id: string,
    authorRole: CommissionMessage["authorRole"],
    authorName: string,
    body: string,
  ) => Commission | null;
  addWip: (
    id: string,
    wip: Omit<WipUpdate, "id" | "postedAt">,
  ) => Commission | null;
  recordBlessing: (
    id: string,
    record: Omit<BlessingRecord, "recordedAt">,
  ) => Commission | null;
  cancelCommission: (id: string) => Commission | null;

  // Artist signup
  signedUpArtist: SignedUpArtist | null;
  signUpArtist: (a: SignedUpArtist) => void;

  // Stripe Connect (mocked)
  connectAccounts: Record<string, ConnectAccount>;
  getConnect: (artistSlug: string) => ConnectAccount | null;
  startConnect: (artistSlug: string) => ConnectAccount;
  completeConnect: (
    artistSlug: string,
    payoutAccountBank: string,
    payoutAccountLast4: string,
  ) => ConnectAccount;
  submitTaxForm: (artistSlug: string) => ConnectAccount | null;

  // Verifications
  verifications: Verification[];
  submitVerification: (input: VerificationInput) => Verification;
  getVerificationByToken: (token: string) => Verification | null;
  getVerificationByChanceryToken: (token: string) => Verification | null;
  priestRespond: (
    token: string,
    action: "endorse" | "decline" | "discuss",
    notes?: string,
  ) => Verification | null;
  chanceryRespond: (
    token: string,
    action: "confirm" | "decline",
    notes?: string,
  ) => Verification | null;
  revokeByToken: (token: string) => Verification | null;
}

const StoreCtx = React.createContext<StoreState | null>(null);

const STORAGE_KEY = "ars-sacra:v3";

interface Persisted {
  commissions: Commission[];
  signedUpArtist: SignedUpArtist | null;
  verifications: Verification[];
  connectAccounts: Record<string, ConnectAccount>;
}

const EMPTY: Persisted = {
  commissions: [],
  signedUpArtist: null,
  verifications: [],
  connectAccounts: {},
};

function load(): Persisted {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        commissions: seedCommissions(),
        signedUpArtist: null,
        verifications: [],
        connectAccounts: seedConnect(),
      };
    }
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      commissions: parsed.commissions ?? seedCommissions(),
      signedUpArtist: parsed.signedUpArtist ?? null,
      verifications: parsed.verifications ?? [],
      connectAccounts: parsed.connectAccounts ?? seedConnect(),
    };
  } catch {
    return EMPTY;
  }
}

function save(state: Persisted) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 14)}${Date.now().toString(36)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<Persisted>(() => load());

  React.useEffect(() => {
    save(state);
  }, [state]);

  // Helper: update one commission by id, return the new commission (for return values)
  function patchCommission(
    id: string,
    fn: (c: Commission) => Commission,
  ): Commission | null {
    let updated: Commission | null = null;
    setState((s) => ({
      ...s,
      commissions: s.commissions.map((c) => {
        if (c.id !== id) return c;
        const next = fn(c);
        updated = next;
        return next;
      }),
    }));
    return updated;
  }

  const value: StoreState = React.useMemo(
    () => ({
      // ===== Commissions =====
      commissions: state.commissions,

      getCommission: (id) =>
        state.commissions.find((c) => c.id === id) ?? null,

      createCommission: (input) => {
        const c: Commission = {
          id: makeId("cmn"),
          artistSlug: input.artistSlug,
          patronName: input.patronName,
          patronEmail: input.patronEmail,
          category: input.category,
          setting: input.setting,
          scope: input.scope,
          preferredDeadline: input.preferredDeadline,
          feastDeadline: input.feastDeadline,
          patronSaint: input.patronSaint,
          parishOrChapel: input.parishOrChapel,
          diocese: input.diocese,
          platformFeePct: PLATFORM_FEE_PCT,
          stage: "scoping",
          escrow: [],
          messages: [
            {
              id: makeId("msg"),
              authorRole: "system",
              authorName: "Ars Sacra",
              body: `${input.patronName} sent a request. The artist will reply with a quote.`,
              createdAt: nowIso(),
            },
            {
              id: makeId("msg"),
              authorRole: "patron",
              authorName: input.patronName,
              body: input.scope,
              createdAt: nowIso(),
            },
          ],
          wip: [],
          createdAt: nowIso(),
        };
        setState((s) => ({ ...s, commissions: [c, ...s.commissions] }));
        return c;
      },

      artistQuote: (id, artistTotalUsd, quoteNote, feePct) => {
        const pricing = computePricing(artistTotalUsd, feePct ?? PLATFORM_FEE_PCT);
        return patchCommission(id, (c) => ({
          ...c,
          stage: "awaiting-deposit",
          artistTotalUsd: pricing.artistTotalUsd,
          platformFeePct: pricing.platformFeePct,
          platformFeeUsd: pricing.platformFeeUsd,
          totalDueUsd: pricing.totalDueUsd,
          artistQuoteNote: quoteNote,
          escrow: pricing.escrow,
          messages: [
            ...c.messages,
            {
              id: makeId("msg"),
              authorRole: "artist",
              authorName: "Artist",
              body: quoteNote,
              createdAt: nowIso(),
            },
            {
              id: makeId("msg"),
              authorRole: "system",
              authorName: "Ars Sacra",
              body: `Artist quoted $${pricing.artistTotalUsd.toLocaleString()}. Three milestones funded as work progresses.`,
              createdAt: nowIso(),
            },
          ],
        }));
      },

      fundEscrow: (id, stage) =>
        patchCommission(id, (c) => {
          const escrow = c.escrow.map((m) =>
            m.stage === stage && m.status === "unfunded"
              ? { ...m, status: "held" as const, fundedAt: nowIso() }
              : m,
          );
          // Stage transition: deposit funded → in-progress
          let nextStage = c.stage;
          if (stage === "deposit") nextStage = "in-progress";
          return {
            ...c,
            escrow,
            stage: nextStage,
            messages: [
              ...c.messages,
              {
                id: makeId("msg"),
                authorRole: "system",
                authorName: "Ars Sacra",
                body: `${c.patronName} funded the ${stage} milestone. Funds are held in escrow.`,
                createdAt: nowIso(),
              },
            ],
          };
        }),

      releaseMilestone: (id, stage) =>
        patchCommission(id, (c) => {
          const escrow = c.escrow.map((m) =>
            m.stage === stage && m.status === "held"
              ? { ...m, status: "released" as const, releasedAt: nowIso() }
              : m,
          );
          // Lifecycle progression
          let nextStage = c.stage;
          let completedAt = c.completedAt;
          if (stage === "midpoint") nextStage = "in-progress";
          if (stage === "final") {
            nextStage = "delivered";
            completedAt = nowIso();
          }
          return {
            ...c,
            escrow,
            stage: nextStage,
            completedAt,
            certificate:
              stage === "final" && !c.certificate
                ? {
                    issuedAt: nowIso(),
                    serial: `AS-${new Date().getFullYear()}-${c.id.slice(-6).toUpperCase()}`,
                    title: c.scope.split(/[\.\n]/)[0].slice(0, 80) || "Untitled",
                  }
                : c.certificate,
            messages: [
              ...c.messages,
              {
                id: makeId("msg"),
                authorRole: "system",
                authorName: "Ars Sacra",
                body:
                  stage === "final"
                    ? `${c.patronName} released the final payment. Commission delivered.`
                    : `${c.patronName} released the ${stage} milestone to the artist.`,
                createdAt: nowIso(),
              },
            ],
          };
        }),

      artistMarkMidpoint: (id, body) =>
        patchCommission(id, (c) => ({
          ...c,
          stage: "midpoint-review",
          messages: [
            ...c.messages,
            {
              id: makeId("msg"),
              authorRole: "artist",
              authorName: "Artist",
              body,
              createdAt: nowIso(),
            },
            {
              id: makeId("msg"),
              authorRole: "system",
              authorName: "Ars Sacra",
              body: "Artist marked the midpoint. Review the work and release the midpoint payment when ready.",
              createdAt: nowIso(),
            },
          ],
        })),

      artistMarkFinal: (id, body, _title) =>
        patchCommission(id, (c) => ({
          ...c,
          stage: "final-review",
          messages: [
            ...c.messages,
            {
              id: makeId("msg"),
              authorRole: "artist",
              authorName: "Artist",
              body,
              createdAt: nowIso(),
            },
            {
              id: makeId("msg"),
              authorRole: "system",
              authorName: "Ars Sacra",
              body: "Artist marked the work complete. Inspect and release the final payment.",
              createdAt: nowIso(),
            },
          ],
        })),

      addMessage: (id, authorRole, authorName, body) =>
        patchCommission(id, (c) => ({
          ...c,
          messages: [
            ...c.messages,
            {
              id: makeId("msg"),
              authorRole,
              authorName,
              body,
              createdAt: nowIso(),
            },
          ],
        })),

      addWip: (id, wip) =>
        patchCommission(id, (c) => ({
          ...c,
          wip: [
            ...c.wip,
            {
              ...wip,
              id: makeId("wip"),
              postedAt: nowIso(),
            },
          ],
          messages: [
            ...c.messages,
            {
              id: makeId("msg"),
              authorRole: "artist",
              authorName: "Artist",
              body: `New studio update: ${wip.caption}`,
              createdAt: nowIso(),
            },
          ],
        })),

      recordBlessing: (id, record) =>
        patchCommission(id, (c) => ({
          ...c,
          stage: "blessed",
          blessing: { ...record, recordedAt: nowIso() },
          messages: [
            ...c.messages,
            {
              id: makeId("msg"),
              authorRole: "system",
              authorName: "Ars Sacra",
              body: `Blessing recorded by ${record.recordedBy}${record.parishOrChapel ? ` at ${record.parishOrChapel}` : ""}.`,
              createdAt: nowIso(),
            },
          ],
        })),

      cancelCommission: (id) =>
        patchCommission(id, (c) => ({
          ...c,
          stage: "cancelled",
          cancelledAt: nowIso(),
          escrow: c.escrow.map((m) =>
            m.status === "held"
              ? { ...m, status: "refunded" as const }
              : m,
          ),
          messages: [
            ...c.messages,
            {
              id: makeId("msg"),
              authorRole: "system",
              authorName: "Ars Sacra",
              body: "Commission cancelled. Held funds were refunded to the patron.",
              createdAt: nowIso(),
            },
          ],
        })),

      // ===== Artist signup =====
      signedUpArtist: state.signedUpArtist,
      signUpArtist: (a) => {
        setState((s) => ({ ...s, signedUpArtist: a }));
      },

      // ===== Connect =====
      connectAccounts: state.connectAccounts,
      getConnect: (slug) => state.connectAccounts[slug] ?? null,
      startConnect: (slug) => {
        const acc: ConnectAccount = {
          artistSlug: slug,
          status: "onboarding" as ConnectStatus,
          taxFormStatus: "missing",
          startedAt: nowIso(),
        };
        setState((s) => ({
          ...s,
          connectAccounts: { ...s.connectAccounts, [slug]: acc },
        }));
        return acc;
      },
      completeConnect: (slug, bank, last4) => {
        const existing = state.connectAccounts[slug];
        const acc: ConnectAccount = {
          artistSlug: slug,
          status: "verified",
          payoutAccountBank: bank,
          payoutAccountLast4: last4,
          taxFormStatus: existing?.taxFormStatus ?? "pending",
          startedAt: existing?.startedAt ?? nowIso(),
          verifiedAt: nowIso(),
        };
        setState((s) => ({
          ...s,
          connectAccounts: { ...s.connectAccounts, [slug]: acc },
        }));
        return acc;
      },
      submitTaxForm: (slug) => {
        const existing = state.connectAccounts[slug];
        if (!existing) return null;
        const acc: ConnectAccount = { ...existing, taxFormStatus: "on-file" };
        setState((s) => ({
          ...s,
          connectAccounts: { ...s.connectAccounts, [slug]: acc },
        }));
        return acc;
      },

      // ===== Verifications =====
      verifications: state.verifications,

      submitVerification: (input) => {
        const c = classifyEmail(input.verifierEmail);
        const isFree = c.isFreeWebmail;
        const token = makeId("ver");
        const chanceryToken = isFree ? makeId("chy") : undefined;
        const v: Verification = {
          token,
          chanceryToken,
          status: "pending",
          role: input.role,
          verifierName: input.verifierName,
          verifierEmail: input.verifierEmail,
          verifierEmailIsFreeWebmail: isFree,
          parishOrCommunity: input.parishOrCommunity,
          parishWebsite: input.parishWebsite,
          diocese: input.diocese,
          chanceryEmail: input.chanceryEmail,
          createdAt: nowIso(),
        };
        setState((s) => ({
          ...s,
          verifications: [v, ...s.verifications],
          signedUpArtist: s.signedUpArtist
            ? { ...s.signedUpArtist, verificationToken: token }
            : s.signedUpArtist,
        }));
        return v;
      },

      getVerificationByToken: (token) =>
        state.verifications.find((v) => v.token === token) ?? null,

      getVerificationByChanceryToken: (token) =>
        state.verifications.find((v) => v.chanceryToken === token) ?? null,

      priestRespond: (token, action, notes) => {
        let updated: Verification | null = null;
        setState((s) => ({
          ...s,
          verifications: s.verifications.map((v) => {
            if (v.token !== token) return v;
            const now = nowIso();
            const next: Verification = { ...v, notes };
            if (action === "endorse") {
              next.endorsedAt = now;
              if (v.verifierEmailIsFreeWebmail) {
                next.status = "endorsed-chancery-pending";
              } else {
                next.status = "endorsed";
                next.expiresAt = oneYearFrom(now);
              }
            } else if (action === "decline") {
              next.status = "declined";
            } else {
              next.status = "discuss";
            }
            updated = next;
            return next;
          }),
        }));
        return updated;
      },

      chanceryRespond: (token, action, notes) => {
        let updated: Verification | null = null;
        setState((s) => ({
          ...s,
          verifications: s.verifications.map((v) => {
            if (v.chanceryToken !== token) return v;
            const now = nowIso();
            const next: Verification = { ...v, chanceryNotes: notes };
            if (action === "confirm") {
              next.chanceryConfirmedAt = now;
              next.status = "chancery-confirmed";
              next.expiresAt = oneYearFrom(now);
            } else {
              next.status = "declined";
            }
            updated = next;
            return next;
          }),
        }));
        return updated;
      },

      revokeByToken: (token) => {
        let updated: Verification | null = null;
        setState((s) => ({
          ...s,
          verifications: s.verifications.map((v) => {
            if (v.token !== token && v.chanceryToken !== token) return v;
            const next: Verification = { ...v, status: "revoked" };
            updated = next;
            return next;
          }),
        }));
        return updated;
      },
    }),
    [state],
  );

  return React.createElement(StoreCtx.Provider, { value }, children);
}

export function useStore() {
  const ctx = React.useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

function oneYearFrom(iso: string) {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}
