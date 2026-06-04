/**
 * Sentry initialization — federation-aware error tracking.
 *
 * DSN is fetched from /api/config at runtime (Worker secret), with
 * VITE_SENTRY_DSN as a build-time fallback for local dev.
 */
import * as Sentry from "@sentry/react";
import { loadConfig } from "./config";

loadConfig().then((cfg) => {
  if (!cfg.sentry_dsn) return;
  Sentry.init({
    dsn: cfg.sentry_dsn,
    environment: import.meta.env.MODE,
    release: (import.meta.env.VITE_APP_VERSION as string | undefined) ?? "unknown",
    initialScope: {
      tags: {
        app_slug: "catholicart",
        federation_phase: "5",
      },
    },
    sendDefaultPii: false,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 1.0,
    tracePropagationTargets: [
      "localhost",
      /^https:\/\/catholicart\.workers\.dev/,
    ],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
});
