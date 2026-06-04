// Runtime client config. Worker secrets aren't available to Vite's
// build step, so we fetch the public-safe ones (Mapbox token, Sentry
// DSN, site URL) from the Worker on first read and cache them in
// module scope.
//
// Build-time fallback: if VITE_MAPBOX_TOKEN happens to be defined at
// build time (e.g. `npm run dev` with a local .env), we use it
// immediately and skip the fetch.

export interface ClientConfig {
  mapbox_token: string;
  mapbox_style: string;
  sentry_dsn: string;
  site_url: string;
}

const BUILD_TIME_FALLBACK: ClientConfig = {
  mapbox_token: (import.meta.env.VITE_MAPBOX_TOKEN as string) ?? '',
  mapbox_style: (import.meta.env.VITE_MAPBOX_STYLE as string) ?? '',
  sentry_dsn: (import.meta.env.VITE_SENTRY_DSN as string) ?? '',
  site_url:
    (import.meta.env.VITE_SITE_URL as string) ??
    (typeof window !== 'undefined' ? window.location.origin : ''),
};

let cached: ClientConfig | null = null;
let inflight: Promise<ClientConfig> | null = null;

export async function loadConfig(): Promise<ClientConfig> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch('/api/config', {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`config fetch ${res.status}`);
      const data = (await res.json()) as Partial<ClientConfig>;
      cached = {
        mapbox_token: data.mapbox_token || BUILD_TIME_FALLBACK.mapbox_token,
        mapbox_style: data.mapbox_style || BUILD_TIME_FALLBACK.mapbox_style,
        sentry_dsn: data.sentry_dsn || BUILD_TIME_FALLBACK.sentry_dsn,
        site_url: data.site_url || BUILD_TIME_FALLBACK.site_url,
      };
    } catch {
      // Offline / dev without Worker / endpoint missing → use whatever
      // we have from the build.
      cached = BUILD_TIME_FALLBACK;
    } finally {
      inflight = null;
    }
    return cached!;
  })();

  return inflight;
}

// Synchronous read of build-time values. Useful as an initial state
// before the async fetch completes.
export function buildTimeConfig(): ClientConfig {
  return BUILD_TIME_FALLBACK;
}
