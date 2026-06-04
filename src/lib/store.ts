import * as React from "react";
import type {
  ApprenticeshipApplication,
  ApprovalStep,
  ArtistAvailability,
  ArtistSuspension,
  AvailabilityMonthStatus,
  CommissionFlag,
  FlagReason,
  Commission,
  CommissionMessage,
  ConnectAccount,
  ConnectStatus,
  Dispute,
  EscrowStage,
  InstitutionalIntake,
  IpTerms,
  Proposal,
  Review,
  ShippingRecord,
  Verification,
  VerifierRole,
  WipUpdate,
  BlessingRecord,
} from "../types";
import { classifyEmail } from "./email-policy";
import { PLATFORM_FEE_PCT, computePricing } from "./pricing";
import { deriveTitle } from "./utils";
import { notify } from "./email/notify";
import { artistBySlug } from "../data/artists";
import { seedCommissions } from "../data/seed-commissions";
import { seedConnect } from "../data/seed-connect";
import { seedReviews } from "../data/seed-reviews";
import { seedIntakes, seedProposals } from "../data/seed-intakes";

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
  ipTerms?: IpTerms;
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
  recordShipping: (id: string, record: Omit<ShippingRecord, "shippedAt">) => Commission | null;
  setIpTerms: (id: string, terms: IpTerms, customNote?: string) => Commission | null;

  // Reviews
  reviews: Review[];
  reviewsForArtist: (artistSlug: string) => Review[];
  reviewForCommission: (commissionId: string) => Review | null;
  submitReview: (input: { commissionId: string; rating: Review["rating"]; body: string }) => Review | null;
  artistReplyToReview: (reviewId: string, body: string) => Review | null;

  // Disputes
  disputes: Dispute[];
  disputesForCommission: (commissionId: string) => Dispute[];
  openDispute: (input: { commissionId: string; openedBy: "patron" | "artist"; reason: string }) => Dispute | null;
  resolveDispute: (
    disputeId: string,
    resolution: "resolved-mediated" | "resolved-refund" | "resolved-release" | "withdrawn",
    note?: string,
  ) => Dispute | null;

  // Artist availability
  availability: Record<string, ArtistAvailability>;
  getAvailability: (artistSlug: string) => ArtistAvailability | null;
  setMonthAvailability: (artistSlug: string, monthKey: string, status: AvailabilityMonthStatus) => ArtistAvailability;
  setConcurrentCap: (artistSlug: string, cap: number | null) => ArtistAvailability;

  // Apprenticeship applications
  apprenticeships: ApprenticeshipApplication[];
  submitApprenticeship: (input: Omit<ApprenticeshipApplication, "id" | "status" | "createdAt">) => ApprenticeshipApplication;

  // Moderation
  commissionFlags: CommissionFlag[];
  artistSuspensions: ArtistSuspension[];
  flagCommission: (input: { commissionId: string; reason: FlagReason; note?: string; flaggedBy?: CommissionFlag["flaggedBy"] }) => CommissionFlag;
  clearCommissionFlag: (commissionId: string) => void;
  suspendArtist: (artistSlug: string, reason: string) => ArtistSuspension;
  liftArtistSuspension: (artistSlug: string) => void;
  isArtistSuspended: (artistSlug: string) => boolean;

  // Institutional (B2B) intakes + proposals
  intakes: InstitutionalIntake[];
  proposals: Proposal[];
  getIntake: (id: string) => InstitutionalIntake | null;
  submitIntake: (input: Omit<InstitutionalIntake, "id" | "status" | "proposalIds" | "commissionIds" | "createdAt" | "updatedAt"> & { status?: InstitutionalIntake["status"] }) => InstitutionalIntake;
  submitProposal: (input: Omit<Proposal, "id" | "status" | "submittedAt">) => Proposal | null;
  setApprovalStep: (intakeId: string, role: string, status: ApprovalStep["status"], note?: string) => InstitutionalIntake | null;
  awardProposal: (intakeId: string, proposalId: string) => InstitutionalIntake | null;
  setIntakeStatus: (intakeId: string, status: InstitutionalIntake["status"]) => InstitutionalIntake | null;

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
  reviews: Review[];
  disputes: Dispute[];
  intakes: InstitutionalIntake[];
  proposals: Proposal[];
  availability: Record<string, ArtistAvailability>;
  apprenticeships: ApprenticeshipApplication[];
  commissionFlags: CommissionFlag[];
  artistSuspensions: ArtistSuspension[];
}

const EMPTY: Persisted = {
  commissions: [],
  signedUpArtist: null,
  verifications: [],
  connectAccounts: {},
  reviews: [],
  disputes: [],
  intakes: [],
  proposals: [],
  availability: {},
  apprenticeships: [],
  commissionFlags: [],
  artistSuspensions: [],
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
        reviews: seedReviews(),
        disputes: [],
        intakes: seedIntakes(),
        proposals: seedProposals(),
        availability: {},
        apprenticeships: [],
        commissionFlags: [],
        artistSuspensions: [],
      };
    }
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      commissions: parsed.commissions ?? seedCommissions(),
      signedUpArtist: parsed.signedUpArtist ?? null,
      verifications: parsed.verifications ?? [],
      connectAccounts: parsed.connectAccounts ?? seedConnect(),
      reviews: parsed.reviews ?? seedReviews(),
      disputes: parsed.disputes ?? [],
      intakes: parsed.intakes ?? seedIntakes(),
      proposals: parsed.proposals ?? seedProposals(),
      availability: parsed.availability ?? {},
      apprenticeships: parsed.apprenticeships ?? [],
      commissionFlags: parsed.commissionFlags ?? [],
      artistSuspensions: parsed.artistSuspensions ?? [],
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
          ipTerms: input.ipTerms ?? "patron-exclusive",
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
        notify({ kind: "commission.created", commission: c, artist: artistBySlug(c.artistSlug) ?? undefined });
        return c;
      },

      artistQuote: (id, artistTotalUsd, quoteNote, feePct) => {
        const pricing = computePricing(artistTotalUsd, feePct ?? PLATFORM_FEE_PCT);
        const updated = patchCommission(id, (c) => ({
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
        if (updated) notify({ kind: "commission.quoted", commission: updated, artist: artistBySlug(updated.artistSlug) ?? undefined });
        return updated;
      },

      fundEscrow: (id, stage) => {
        const updated = patchCommission(id, (c) => {
          const escrow = c.escrow.map((m) =>
            m.stage === stage && m.status === "unfunded"
              ? { ...m, status: "held" as const, fundedAt: nowIso() }
              : m,
          );
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
        });
        if (updated) notify({ kind: "commission.funded", commission: updated, artist: artistBySlug(updated.artistSlug) ?? undefined, stage });
        return updated;
      },

      releaseMilestone: (id, stage) => {
        const updated = patchCommission(id, (c) => {
          const escrow = c.escrow.map((m) =>
            m.stage === stage && m.status === "held"
              ? { ...m, status: "released" as const, releasedAt: nowIso() }
              : m,
          );
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
                    title: deriveTitle(c.scope),
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
        });
        if (updated) {
          const artist = artistBySlug(updated.artistSlug) ?? undefined;
          notify({ kind: "commission.released", commission: updated, artist, stage });
          if (stage === "final") notify({ kind: "commission.delivered", commission: updated, artist });
        }
        return updated;
      },

      artistMarkMidpoint: (id, body) => {
        const updated = patchCommission(id, (c) => ({
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
        }));
        if (updated) notify({ kind: "commission.midpoint", commission: updated, artist: artistBySlug(updated.artistSlug) ?? undefined });
        return updated;
      },

      artistMarkFinal: (id, body, _title) => {
        const updated = patchCommission(id, (c) => ({
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
        }));
        if (updated) notify({ kind: "commission.final", commission: updated, artist: artistBySlug(updated.artistSlug) ?? undefined });
        return updated;
      },

      addMessage: (id, authorRole, authorName, body) => {
        const updated = patchCommission(id, (c) => ({
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
        }));
        if (updated && (authorRole === "patron" || authorRole === "artist")) {
          notify({
            kind: "commission.message",
            commission: updated,
            artist: artistBySlug(updated.artistSlug) ?? undefined,
            fromRole: authorRole,
            body,
          });
        }
        return updated;
      },

      addWip: (id, wip) => {
        const updated = patchCommission(id, (c) => ({
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
        }));
        if (updated) notify({ kind: "commission.wip", commission: updated, artist: artistBySlug(updated.artistSlug) ?? undefined, caption: wip.caption });
        return updated;
      },

      recordBlessing: (id, record) => {
        const updated = patchCommission(id, (c) => ({
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
        }));
        if (updated) notify({ kind: "commission.blessed", commission: updated, artist: artistBySlug(updated.artistSlug) ?? undefined });
        return updated;
      },

      cancelCommission: (id) => {
        const updated = patchCommission(id, (c) => ({
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
        }));
        if (updated) notify({ kind: "commission.cancelled", commission: updated, artist: artistBySlug(updated.artistSlug) ?? undefined });
        return updated;
      },

      recordShipping: (id, record) => {
        const updated = patchCommission(id, (c) => ({
          ...c,
          shipping: { ...record, shippedAt: nowIso() },
          messages: [
            ...c.messages,
            {
              id: makeId("msg"),
              authorRole: "system",
              authorName: "Ars Sacra",
              body: `Shipped via ${record.carrier}${record.trackingNumber ? ` · ${record.trackingNumber}` : ""}.`,
              createdAt: nowIso(),
            },
          ],
        }));
        return updated;
      },

      setIpTerms: (id, terms, customNote) => {
        return patchCommission(id, (c) => ({
          ...c,
          ipTerms: terms,
          ipCustomNote: customNote,
        }));
      },

      // ===== Reviews =====
      reviews: state.reviews,
      reviewsForArtist: (slug) => state.reviews.filter((r) => r.artistSlug === slug),
      reviewForCommission: (id) => state.reviews.find((r) => r.commissionId === id) ?? null,

      submitReview: ({ commissionId, rating, body }) => {
        const c = state.commissions.find((x) => x.id === commissionId);
        if (!c) return null;
        // Only after delivered or blessed
        if (c.stage !== "delivered" && c.stage !== "blessed") return null;
        // One review per commission
        if (state.reviews.some((r) => r.commissionId === commissionId)) return null;
        const review: Review = {
          id: makeId("rev"),
          commissionId,
          artistSlug: c.artistSlug,
          patronName: c.patronName,
          rating,
          body,
          createdAt: nowIso(),
        };
        setState((s) => ({ ...s, reviews: [review, ...s.reviews] }));
        return review;
      },

      artistReplyToReview: (reviewId, body) => {
        let updated: Review | null = null;
        setState((s) => ({
          ...s,
          reviews: s.reviews.map((r) => {
            if (r.id !== reviewId) return r;
            const next: Review = {
              ...r,
              artistReply: { body, createdAt: nowIso() },
            };
            updated = next;
            return next;
          }),
        }));
        return updated;
      },

      // ===== Disputes =====
      disputes: state.disputes,
      disputesForCommission: (id) => state.disputes.filter((d) => d.commissionId === id),

      openDispute: ({ commissionId, openedBy, reason }) => {
        const c = state.commissions.find((x) => x.id === commissionId);
        if (!c) return null;
        // Can't dispute a cancelled commission
        if (c.stage === "cancelled") return null;
        const d: Dispute = {
          id: makeId("dsp"),
          commissionId,
          openedBy,
          reason,
          status: "open",
          openedAt: nowIso(),
        };
        setState((s) => ({
          ...s,
          disputes: [d, ...s.disputes],
          // Attach a system message to the commission
          commissions: s.commissions.map((co) =>
            co.id === commissionId
              ? {
                  ...co,
                  messages: [
                    ...co.messages,
                    {
                      id: makeId("msg"),
                      authorRole: "system" as const,
                      authorName: "Ars Sacra",
                      body: `Dispute opened by the ${openedBy}: "${reason}". A guild mediator will reach out within 48 hours.`,
                      createdAt: nowIso(),
                    },
                  ],
                }
              : co,
          ),
        }));
        return d;
      },

      resolveDispute: (disputeId, resolution, note) => {
        let updated: Dispute | null = null;
        setState((s) => {
          const disp = s.disputes.find((d) => d.id === disputeId);
          if (!disp) return s;
          const next: Dispute = {
            ...disp,
            status: resolution,
            resolvedAt: nowIso(),
            resolutionNote: note,
          };
          updated = next;
          const commissions = s.commissions.map((c) =>
            c.id === disp.commissionId
              ? {
                  ...c,
                  // If mediator refunded, mark held funds as refunded
                  escrow:
                    resolution === "resolved-refund"
                      ? c.escrow.map((m) =>
                          m.status === "held"
                            ? { ...m, status: "refunded" as const }
                            : m,
                        )
                      : c.escrow,
                  messages: [
                    ...c.messages,
                    {
                      id: makeId("msg"),
                      authorRole: "system" as const,
                      authorName: "Ars Sacra",
                      body: `Dispute ${resolution.replace("resolved-", "resolved by ")}.${note ? ` ${note}` : ""}`,
                      createdAt: nowIso(),
                    },
                  ],
                }
              : c,
          );
          return {
            ...s,
            commissions,
            disputes: s.disputes.map((d) => (d.id === disputeId ? next : d)),
          };
        });
        return updated;
      },

      // ===== Artist availability =====
      availability: state.availability,
      getAvailability: (slug) => state.availability[slug] ?? null,
      setMonthAvailability: (slug, monthKey, status) => {
        const existing =
          state.availability[slug] ?? {
            artistSlug: slug,
            months: {},
            updatedAt: nowIso(),
          };
        const next: ArtistAvailability = {
          ...existing,
          months: { ...existing.months, [monthKey]: status },
          updatedAt: nowIso(),
        };
        setState((s) => ({
          ...s,
          availability: { ...s.availability, [slug]: next },
        }));
        return next;
      },
      setConcurrentCap: (slug, cap) => {
        const existing =
          state.availability[slug] ?? {
            artistSlug: slug,
            months: {},
            updatedAt: nowIso(),
          };
        const next: ArtistAvailability = {
          ...existing,
          concurrentCap: cap ?? undefined,
          updatedAt: nowIso(),
        };
        setState((s) => ({
          ...s,
          availability: { ...s.availability, [slug]: next },
        }));
        return next;
      },

      // ===== Apprenticeships =====
      apprenticeships: state.apprenticeships,
      submitApprenticeship: (input) => {
        const a: ApprenticeshipApplication = {
          ...input,
          id: makeId("app"),
          status: "submitted",
          createdAt: nowIso(),
        };
        setState((s) => ({ ...s, apprenticeships: [a, ...s.apprenticeships] }));
        return a;
      },

      // ===== Moderation =====
      commissionFlags: state.commissionFlags,
      artistSuspensions: state.artistSuspensions,

      flagCommission: (input) => {
        const flag: CommissionFlag = {
          commissionId: input.commissionId,
          reason: input.reason,
          note: input.note,
          flaggedAt: nowIso(),
          flaggedBy: input.flaggedBy ?? "operator",
        };
        setState((s) => ({
          ...s,
          commissionFlags: [
            flag,
            ...s.commissionFlags.filter((f) => f.commissionId !== input.commissionId),
          ],
        }));
        return flag;
      },

      clearCommissionFlag: (commissionId) => {
        setState((s) => ({
          ...s,
          commissionFlags: s.commissionFlags.filter((f) => f.commissionId !== commissionId),
        }));
      },

      suspendArtist: (slug, reason) => {
        const s: ArtistSuspension = {
          artistSlug: slug,
          reason,
          suspendedAt: nowIso(),
        };
        setState((st) => ({
          ...st,
          artistSuspensions: [
            s,
            ...st.artistSuspensions.filter((x) => x.artistSlug !== slug),
          ],
        }));
        return s;
      },

      liftArtistSuspension: (slug) => {
        setState((s) => ({
          ...s,
          artistSuspensions: s.artistSuspensions.map((x) =>
            x.artistSlug === slug && !x.liftedAt ? { ...x, liftedAt: nowIso() } : x,
          ),
        }));
      },

      isArtistSuspended: (slug) =>
        state.artistSuspensions.some((s) => s.artistSlug === slug && !s.liftedAt),

      // ===== Institutional intakes + proposals =====
      intakes: state.intakes,
      proposals: state.proposals,

      getIntake: (id) => state.intakes.find((i) => i.id === id) ?? null,

      submitIntake: (input) => {
        const intake: InstitutionalIntake = {
          ...input,
          id: makeId("ink"),
          status: input.status ?? "open",
          proposalIds: [],
          commissionIds: [],
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        setState((s) => ({ ...s, intakes: [intake, ...s.intakes] }));
        return intake;
      },

      submitProposal: (input) => {
        const intake = state.intakes.find((i) => i.id === input.intakeId);
        if (!intake) return null;
        if (intake.status !== "open" && intake.status !== "shortlisting") return null;
        const p: Proposal = {
          ...input,
          id: makeId("prp"),
          status: "submitted",
          submittedAt: nowIso(),
        };
        setState((s) => ({
          ...s,
          proposals: [p, ...s.proposals],
          intakes: s.intakes.map((i) =>
            i.id === input.intakeId
              ? { ...i, proposalIds: [...i.proposalIds, p.id], updatedAt: nowIso() }
              : i,
          ),
        }));
        return p;
      },

      setApprovalStep: (intakeId, role, status, note) => {
        let updated: InstitutionalIntake | null = null;
        setState((s) => ({
          ...s,
          intakes: s.intakes.map((i) => {
            if (i.id !== intakeId) return i;
            const next: InstitutionalIntake = {
              ...i,
              approvalChain: i.approvalChain.map((step) =>
                step.role === role
                  ? { ...step, status, decidedAt: nowIso(), note }
                  : step,
              ),
              updatedAt: nowIso(),
            };
            updated = next;
            return next;
          }),
        }));
        return updated;
      },

      awardProposal: (intakeId, proposalId) => {
        let updated: InstitutionalIntake | null = null;
        setState((s) => ({
          ...s,
          proposals: s.proposals.map((p) =>
            p.intakeId === intakeId
              ? {
                  ...p,
                  status:
                    p.id === proposalId ? ("awarded" as const) : ("declined" as const),
                  decidedAt: nowIso(),
                }
              : p,
          ),
          intakes: s.intakes.map((i) => {
            if (i.id !== intakeId) return i;
            const next: InstitutionalIntake = {
              ...i,
              awardedProposalId: proposalId,
              status: "awarded" as const,
              updatedAt: nowIso(),
            };
            updated = next;
            return next;
          }),
        }));
        return updated;
      },

      setIntakeStatus: (intakeId, status) => {
        let updated: InstitutionalIntake | null = null;
        setState((s) => ({
          ...s,
          intakes: s.intakes.map((i) => {
            if (i.id !== intakeId) return i;
            const next: InstitutionalIntake = { ...i, status, updatedAt: nowIso() };
            updated = next;
            return next;
          }),
        }));
        return updated;
      },

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
        notify({ kind: "verification.requested", verification: v });
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
        if (updated) {
          if (action === "endorse") {
            notify({ kind: "verification.endorsed", verification: updated });
            if ((updated as Verification).verifierEmailIsFreeWebmail) {
              notify({ kind: "verification.chancery", verification: updated });
            }
          } else if (action === "decline") {
            notify({ kind: "verification.declined", verification: updated });
          }
        }
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
        if (updated) {
          if (action === "confirm") notify({ kind: "verification.confirmed", verification: updated });
          else notify({ kind: "verification.declined", verification: updated });
        }
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
