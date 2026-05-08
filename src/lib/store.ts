import * as React from "react";
import type { CommissionRequest } from "../types";

interface StoreState {
  requests: CommissionRequest[];
  addRequest: (req: Omit<CommissionRequest, "id" | "createdAt" | "status">) => CommissionRequest;
  signedUpArtist: { name: string; email: string } | null;
  signUpArtist: (a: { name: string; email: string }) => void;
}

const StoreCtx = React.createContext<StoreState | null>(null);

const STORAGE_KEY = "ars-sacra:v1";

interface Persisted {
  requests: CommissionRequest[];
  signedUpArtist: { name: string; email: string } | null;
}

function load(): Persisted {
  if (typeof window === "undefined") {
    return { requests: [], signedUpArtist: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { requests: [], signedUpArtist: null };
    return JSON.parse(raw) as Persisted;
  } catch {
    return { requests: [], signedUpArtist: null };
  }
}

function save(state: Persisted) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
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
