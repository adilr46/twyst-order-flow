import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ENV } from '@/env';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development or when demo mode is explicitly enabled
    const isProduction = ENV.NODE_ENV === 'production';
    const isDemoMode = ENV.DEMO_MODE === 'true';
    
    if (isProduction && !isDemoMode) {
      return NextResponse.json(
        { error: 'Demo access not available in production' }, 
        { status: 404 }
      );
    }

    // Handle both JSON and form data
    let pin: string | undefined;
    let logout: string | undefined;
    
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      pin = body.pin;
      logout = body.logout;
    } else {
      // Handle form data (for logout button)
      const formData = await request.formData();
      pin = formData.get('pin') as string;
      logout = formData.get('logout') as string;
    }

    // Handle logout
    if (logout === 'true') {
      const cookieStore = await cookies();
      cookieStore.delete('demo_auth');
      
      // Redirect to login page after logout
      return NextResponse.redirect(new URL('/dev-launch/login', request.url));
    }

    // Validate PIN format
    if (!pin || typeof pin !== 'string') {
      return NextResponse.json(
        { error: 'Invalid PIN format' }, 
        { status: 400 }
      );
    }

    // Check against server-side demo PIN
    const expectedPin = ENV.DEMO_PIN || '1234';
    
    if (pin.trim() !== expectedPin) {
      // Log failed attempt (in real app, consider rate limiting)
      console.warn(`Failed demo PIN attempt: ${pin} (expected: ${expectedPin})`);
      
      return NextResponse.json(
        { error: 'Invalid demo PIN' }, 
        { status: 401 }
      );
    }

    // Set secure authentication cookie
    const cookieStore = await cookies();
    cookieStore.set('demo_auth', 'ok', {
      path: '/',
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 hours
    });

    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('Demo auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' }, 
      { status: 500 }
    );
  }
}
