// Client → Workers API helpers. Cookies travel automatically with
// same-origin requests, so credentials: 'include' is the only auth
// plumbing the client side needs.

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: unknown };

async function call<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      ...init,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, status: res.status, error: body ?? res.statusText };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (e) {
    return { ok: false, status: 0, error: (e as Error).message };
  }
}

export const api = {
  health: () => call<{ ok: boolean; time: string }>('/api/health'),

  // Auth
  login: (email: string) =>
    call<{ ok: boolean; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  logout: () => call<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  me: () => call<{ user: { id: string; email: string; role: string } | null }>('/api/auth/me'),

  // Reference
  categories: () => call<{ categories: unknown[] }>('/api/categories'),
  saints: () => call<{ saints: unknown[] }>('/api/saints'),
  dioceses: () => call<{ dioceses: unknown[] }>('/api/dioceses'),
  orders: () => call<{ orders: unknown[] }>('/api/orders'),

  // Artists
  listArtists: (params: Record<string, string | number | boolean | undefined> = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '' && v !== false) qs.set(k, String(v));
    }
    const q = qs.toString();
    return call<{ artists: unknown[] }>(`/api/artists${q ? `?${q}` : ''}`);
  },
  artist: (slug: string) =>
    call<{ artist: unknown; categories: string[]; saints: string[]; tiers: unknown[]; works: unknown[]; stats: unknown; reviews: unknown[] }>(`/api/artists/${slug}`),
  similar: (slug: string) => call<{ artists: unknown[] }>(`/api/artists/${slug}/similar`),

  // Commissions
  createCommission: (body: unknown) =>
    call<{ commission: unknown }>(`/api/commissions`, { method: 'POST', body: JSON.stringify(body) }),
  myCommissions: () => call<{ commissions: unknown[] }>(`/api/commissions`),
  commission: (id: string) => call<{ commission: unknown }>(`/api/commissions/${id}`),
  quote: (id: string, body: unknown) =>
    call<{ commission: unknown }>(`/api/commissions/${id}/quote`, { method: 'POST', body: JSON.stringify(body) }),
  fundEscrow: (id: string, stage: 'deposit' | 'midpoint' | 'final') =>
    call<{ commission: unknown }>(`/api/commissions/${id}/escrow/${stage}/fund`, { method: 'POST' }),
  releaseEscrow: (id: string, stage: 'deposit' | 'midpoint' | 'final') =>
    call<{ commission: unknown }>(`/api/commissions/${id}/escrow/${stage}/release`, { method: 'POST' }),
  markMidpoint: (id: string, body: string) =>
    call<{ commission: unknown }>(`/api/commissions/${id}/midpoint`, { method: 'POST', body: JSON.stringify({ body }) }),
  markFinal: (id: string, body: string) =>
    call<{ commission: unknown }>(`/api/commissions/${id}/final`, { method: 'POST', body: JSON.stringify({ body }) }),
  postWip: (id: string, body: unknown) =>
    call<{ commission: unknown }>(`/api/commissions/${id}/wip`, { method: 'POST', body: JSON.stringify(body) }),
  postMessage: (id: string, body: unknown) =>
    call<{ commission: unknown }>(`/api/commissions/${id}/messages`, { method: 'POST', body: JSON.stringify(body) }),
  recordBlessing: (id: string, body: unknown) =>
    call<{ commission: unknown }>(`/api/commissions/${id}/blessing`, { method: 'POST', body: JSON.stringify(body) }),
  cancelCommission: (id: string) =>
    call<{ commission: unknown }>(`/api/commissions/${id}/cancel`, { method: 'POST' }),
  submitReview: (id: string, rating: number, body: string) =>
    call<{ commission: unknown }>(`/api/commissions/${id}/review`, {
      method: 'POST', body: JSON.stringify({ rating, body }),
    }),

  // Public Ledger
  ledger: () => call<{ stats: Record<string, number>; commissions: unknown[] }>('/api/ledger'),

  // Intakes
  listIntakes: (open = true) => call<{ intakes: unknown[] }>(`/api/intakes?open=${open}`),
  intake: (id: string) =>
    call<{ intake: unknown; approvals: unknown[]; proposals: unknown[] }>(`/api/intakes/${id}`),
  createIntake: (body: unknown) =>
    call<{ intake: { id: string }; ok: boolean }>(`/api/intakes`, { method: 'POST', body: JSON.stringify(body) }),
  submitProposal: (id: string, body: unknown) =>
    call<{ proposal: { id: string } }>(`/api/intakes/${id}/proposals`, { method: 'POST', body: JSON.stringify(body) }),

  // Misc
  subscribeJournal: (email: string) =>
    call<{ ok: boolean }>('/api/subscribe', { method: 'POST', body: JSON.stringify({ email }) }),
  applyApprenticeship: (body: unknown) =>
    call<{ ok: boolean }>('/api/apprenticeships', { method: 'POST', body: JSON.stringify(body) }),
  getPreferences: (email: string) =>
    call<{ preferences: Record<string, unknown> }>(`/api/preferences/${encodeURIComponent(email)}`),
  setPreferences: (body: unknown) =>
    call<{ ok: boolean }>('/api/preferences', { method: 'PUT', body: JSON.stringify(body) }),

  // Upload (R2)
  requestWipUpload: (body: { commission_id: string; filename: string; content_type?: string }) =>
    call<{ upload_url: string; image_url: string; key: string }>('/api/upload/wip', {
      method: 'POST', body: JSON.stringify(body),
    }),
};
