import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Singleton getter for the Supabase browser client.
 * Using createBrowserClient ensures the session is automatically synced to cookies,
 * allowing the server-side middleware to verify authentication.
 */
let client: any = null;

export const supabase = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      console.error('Supabase configuration missing in .env.local');
    }
  }

  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
};
