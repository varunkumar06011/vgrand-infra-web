import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';

/**
 * Verifies the Supabase session from the request cookies and returns the authenticated user.
 * Returns null if not authenticated or if env vars are missing.
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll() {
        // No-op in API route context — we only need to read the session
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Returns a 401 NextResponse if the user is not authenticated.
 * Usage:
 *   const user = await getAuthenticatedUser(request);
 *   if (!user) return unauthorizedResponse();
 */
export function unauthorizedResponse() {
  return Response.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}
