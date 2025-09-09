import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ENV } from '@/env'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Basic Auth protection for FOH routes - TEMPORARILY DISABLED FOR TESTING
  // const protectedPaths = [/^\/foh\//, /^\/api\/foh\//];
  // const needsAuth = protectedPaths.some((re) => re.test(pathname));
  
  // if (needsAuth) {
  //   const auth = request.headers.get('authorization');
  //   const user = ENV.FOH_BASIC_USER;
  //   const pass = ENV.FOH_BASIC_PASS;
  //   const expected = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');

  //   if (auth !== expected) {
  //     return new NextResponse('Authentication required', {
  //       status: 401,
  //       headers: { 'WWW-Authenticate': 'Basic realm="FOH"' },
  //     });
  //   }
  // }

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
  const dinerMenuMatch = pathname.match(/^\/d\/([^/]+)$/)
  
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

