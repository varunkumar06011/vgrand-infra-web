import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

/**
 * Enhanced Supabase client that maintains a singleton on the client-side
 * and handles environment-safe initialization.
 */
export const supabase = () => {
  // If no environment variables, throw error early
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (typeof window !== 'undefined') {
      console.error('Supabase configuration missing in .env.local');
    }
    // Return a dummy client or throw to avoid hard crash on import
    throw new Error('Supabase configuration missing');
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

/**
 * Helper to get a service-role client for administrative tasks (server-side only).
 */
export const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
