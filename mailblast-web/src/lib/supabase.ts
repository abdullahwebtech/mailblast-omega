import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === 'YOUR_SUPABASE_URL_HERE') {
    // Return a dummy client that won't crash the app but won't authenticate
    console.warn('[MailBlast Auth] Supabase credentials not configured. Auth features disabled.');
    return null;
  }

  supabaseInstance = createBrowserClient(url, key);
  return supabaseInstance;
}
