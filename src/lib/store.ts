import * as React from "react";
import type {
  CommissionRequest,
  Verification,
  VerifierRole,
} from "../types";
import { classifyEmail } from "./email-policy";

interface SignedUpArtist {
  name: string;
  email: string;
  verificationToken?: string;
}

interface StoreState {
  requests: CommissionRequest[];
  addRequest: (
    req: Omit<CommissionRequest, "id" | "createdAt" | "status">,
  ) => CommissionRequest;
  signedUpArtist: SignedUpArtist | null;
  signUpArtist: (a: SignedUpArtist) => void;

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

export interface VerificationInput {
  role: VerifierRole;
  verifierName: string;
  verifierEmail: string;
  parishOrCommunity: string;
  parishWebsite?: string;
  diocese?: string;
  chanceryEmail?: string;
}

const StoreCtx = React.createContext<StoreState | null>(null);

const STORAGE_KEY = "ars-sacra:v2";

interface Persisted {
  requests: CommissionRequest[];
  signedUpArtist: SignedUpArtist | null;
  verifications: Verification[];
}

const EMPTY: Persisted = {
  requests: [],
  signedUpArtist: null,
  verifications: [],
};

function load(): Persisted {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      requests: parsed.requests ?? [],
      signedUpArtist: parsed.signedUpArtist ?? null,
      verifications: parsed.verifications ?? [],
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

function makeToken(prefix = "tok") {
  // Random enough for a prototype; not a real signed token.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 14)}${Date.now().toString(36)}`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<Persisted>(() => load());

  React.useEffect(() => {
    save(state);
  }, [state]);

  const value: StoreState = React.useMemo(
    () => ({
      requests: state.requests,
      signedUpArtist: state.signedUpArtist,
      verifications: state.verifications,

      addRequest: (req) => {
        const full: CommissionRequest = {
          ...req,
          id: `cr_${Math.random().toString(36).slice(2, 10)}`,
          createdAt: new Date().toISOString(),
          status: "sent",
        };
        setState((s) => ({ ...s, requests: [full, ...s.requests] }));
        return full;
      },

      signUpArtist: (a) => {
        setState((s) => ({ ...s, signedUpArtist: a }));
      },

      submitVerification: (input) => {
        const c = classifyEmail(input.verifierEmail);
        const isFree = c.isFreeWebmail;
        const token = makeToken("ver");
        const chanceryToken = isFree ? makeToken("chy") : undefined;
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
          createdAt: new Date().toISOString(),
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
            const now = new Date().toISOString();
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
            const now = new Date().toISOString();
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
