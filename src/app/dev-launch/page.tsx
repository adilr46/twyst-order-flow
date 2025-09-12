import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ENV } from '@/env';

export default async function DevLaunchPage() {
  // Server-side environment checks
  const isProduction = ENV.NODE_ENV === 'production';
  const isDemoMode = ENV.DEMO_MODE === 'true';
  
  // Block access in production unless explicitly enabled
  if (isProduction && !isDemoMode) {
    notFound();
  }
  
  // Check for demo authentication cookie
  const cookieStore = await cookies();
  const demoAuth = cookieStore.get('demo_auth');
  
  // Redirect to login if not authenticated
  if (!demoAuth || demoAuth.value !== 'ok') {
    redirect('/dev-launch/login');
  }
  
  // Render the demo cockpit
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">🚀 Demo Cockpit</h1>
          <p className="text-muted-foreground">Development and testing tools</p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">
            <span className="mr-2">⚠️</span>
            Demo Mode Active
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/d/demo-cafe?t=demo123" 
            className="p-4 border rounded-lg hover:bg-accent/50 transition-colors text-center"
            scroll={false}
          >
            <div className="text-2xl mb-2">🍽️</div>
            <div className="font-medium">Diner Menu</div>
            <div className="text-sm text-muted-foreground">Customer view</div>
          </Link>
          
          <Link
            href="/d/demo-table/order?orderId=demo123"
            className="p-4 border rounded-lg hover:bg-accent/50 transition-colors text-center"
            scroll={false}
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="font-medium">Order Status</div>
            <div className="text-sm text-muted-foreground">Order tracking</div>
          </Link>
          
          <Link
            href="/foh/demo-cafe"
            className="p-4 border rounded-lg hover:bg-accent/50 transition-colors text-center"
            scroll={false}
          >
            <div className="text-2xl mb-2">👨‍🍳</div>
            <div className="font-medium">FOH Board</div>
            <div className="text-sm text-muted-foreground">Kitchen view</div>
          </Link>
          
          <Link
            href="/test-deeplinks"
            className="p-4 border rounded-lg hover:bg-accent/50 transition-colors text-center"
            scroll={false}
          >
            <div className="text-2xl mb-2">🔗</div>
            <div className="font-medium">Test Deep Links</div>
            <div className="text-sm text-muted-foreground">Link testing</div>
          </Link>
        </div>

        {/* Logout Button */}
        <div className="mb-8 text-center">
          <form action="/api/dev-auth" method="post">
            <input type="hidden" name="logout" value="true" />
            <button
              type="submit"
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
            >
              🚪 Logout from Demo
            </button>
          </form>
        </div>
        
        {/* DevLaunch component removed - content is already inline */}
      </div>
    </div>
  );
}

// Ensure this page is not cached in production
export const dynamic = 'force-dynamic';
