import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly at startup rather than silently hitting undefined endpoints.
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your project values.'
  );
}

// This is the ONLY Supabase client the app should instantiate.
// It uses the public anon key, which is safe to ship to the browser because
// every table it can touch is protected by Row Level Security policies
// (see supabase/migrations). The service_role key must never appear here.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// DEV-ONLY: expose the client on window so we can manually verify RLS
// policies from the browser console while logged in as a real test user.
// import.meta.env.DEV is false in a production build, so this never ships.
if (import.meta.env.DEV) {
  (window as unknown as { supabase: typeof supabase }).supabase = supabase;
}
