import { createBrowserClient } from '@supabase/ssr';

let supabaseInstance: any = null;

/**
 * Enhanced Supabase client that maintains a singleton on the client-side
 * and handles environment-safe initialization.
 */
export const supabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (typeof window !== 'undefined') {
      console.warn(
        '🚀 SUPABASE CONFIGURATION MISSING: Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your Environment Variables on Vercel/GitHub.'
      );
    }
    // Return null instead of throwing to avoid crashing the entire app
    return null;
  }

  // Server-side: always create a new client (or use createServerClient in middleware/actions)
  if (typeof window === 'undefined') {
    return createBrowserClient(url, key);
  }

  // Client-side singleton
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(url, key);
  }

  return supabaseInstance;
};
