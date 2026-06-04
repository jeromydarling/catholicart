// Supabase client + auth helpers.
//
// IMPORTANT: this file is a stub for the post-prototype migration. The
// current prototype uses localStorage via `src/lib/store.ts`. When
// Supabase is provisioned and the store swap is wired, this client
// becomes the only place the app talks to the database.
//
// Env vars (set in .env.local, never commit):
//   VITE_SUPABASE_URL              — https://<project>.supabase.co
//   VITE_SUPABASE_ANON_KEY         — public anon key (safe to ship)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Database typing target — generate with:
//   supabase gen types typescript --project-id <ref> > src/lib/supabase-types.ts
// We import it conditionally so the prototype build doesn't break before it
// exists.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Database = any;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let _client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (_client) return _client;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.",
    );
  }
  _client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
}

// Convenience: subscribe to auth changes from React.
export function onAuthStateChange(
  cb: (event: string, sessionUserId: string | null) => void,
) {
  const { data } = getSupabase().auth.onAuthStateChange((event, session) => {
    cb(event, session?.user?.id ?? null);
  });
  return () => data.subscription.unsubscribe();
}
