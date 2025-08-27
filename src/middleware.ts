import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ENV } from '@/env'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Protect /dev-launch routes
  if (pathname.startsWith('/dev-launch')) {
    // Block in production unless demo mode is explicitly enabled
    const isProduction = ENV.NODE_ENV === 'production'
    const isDemoMode = ENV.DEMO_MODE === 'true'
    
    if (isProduction && !isDemoMode) {
      // Redirect to 404 in production
      return NextResponse.rewrite(new URL('/404', request.url))
    }
    
    // Allow login page without authentication
    if (pathname === '/dev-launch/login') {
      return NextResponse.next()
    }
    
    // Check for demo authentication cookie
    const demoAuth = request.cookies.get('demo_auth')
    if (!demoAuth || demoAuth.value !== 'ok') {
      return NextResponse.redirect(new URL('/dev-launch/login', request.url))
    }
  }

  // Check if the path matches /d/[slug] pattern
  const dinerMenuMatch = pathname.match(/^\/d\/([^\/]+)$/)
  
  if (dinerMenuMatch) {
    const venueSlug = dinerMenuMatch[1]
    const tableToken = searchParams.get('t')
    
    // If no table token 't' parameter, redirect to scan-again
    if (!tableToken) {
      const url = new URL('/scan-again', request.url)
      url.searchParams.set('slug', venueSlug)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

