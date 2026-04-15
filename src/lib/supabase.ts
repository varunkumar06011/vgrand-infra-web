import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Standard Supabase client for client-side operations.
 * Using a function getter (singleton) to ensure valid initialization.
 */
let client: any = null;

export const supabase = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration missing in .env.local');
    // We return a dummy client to prevent 'TypeError: supabase(...) is not a function' 
    // but the actual auth calls will still fail gracefully in the catch block.
  }

  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
};
