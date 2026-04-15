import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js 16 Proxy Middleware (Standardized)
 * Handles session synchronization between browser and server via cookies.
 */
export async function proxy(request: NextRequest) {
  // 1. Create the base response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  try {
    // 2. Initialize Supabase client with standardized cookie handler
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // Update request cookies (for subsequent server-side checks in this request)
            request.cookies.set({ name, value, ...options })
            
            // Update response cookies (to persist in the browser)
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            // Remove from request
            request.cookies.set({ name, value: '', ...options })
            
            // Remove from response
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    // 3. Retrieve user session (this may trigger token refresh via cookies.set)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      // If there's an error getting user, we just treat it as not logged in
      // unless it's a critical error we want to log.
    }

    const { pathname } = request.nextUrl
    const isLoginPage = pathname === '/admin'
    const isAdminPath = pathname.startsWith('/admin')

    // 4. Handle Redirection Logic
    if (isAdminPath) {
      if (!isLoginPage && !user) {
        // Not logged in -> forced to login
        const redirectUrl = new URL('/admin', request.url)
        return NextResponse.redirect(redirectUrl)
      }

      if (isLoginPage && user) {
        // Already logged in -> skip login page
        const redirectUrl = new URL('/admin/dashboard', request.url)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // 5. Inject custom headers for the app to know context
    response.headers.set('x-url', request.url)
    
  } catch (error) {
    console.error('Middleware Processing Error:', error)
    // Return base response on error to avoid crashing the whole path
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
