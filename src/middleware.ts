import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware to protect /admin routes using Supabase Session.
 */
export async function middleware(request: NextRequest) {
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
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const isLoginPage = request.nextUrl.pathname === '/admin'
    const isAdminPath = request.nextUrl.pathname.startsWith('/admin')

    // If trying to access admin subpages without login, redirect to /admin
    if (isAdminPath && !isLoginPage && !user) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // If logged in and on login page, redirect to dashboard
    if (isLoginPage && user) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
    // Add custom header to pass the current URL to the React components
    response.headers.set('x-url', request.url)
  } catch (error) {
    console.error('Middleware Exception:', error)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
