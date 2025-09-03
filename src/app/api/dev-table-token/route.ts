import { NextRequest, NextResponse } from 'next/server';
import { ENV } from '@/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
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

    // Generate demo table tokens for testing
    const demoTokens = [
      {
        venueSlug: 'demo-cafe',
        token: 'demo123',
        tableLabel: 'Table A1',
        description: 'Demo token for Blue Door Café'
      },
      {
        venueSlug: 'demo-cafe',
        token: 'demo456',
        tableLabel: 'Table A2',
        description: 'Demo token for Blue Door Café'
      },
      {
        venueSlug: 'demo-cafe',
        token: 'demo789',
        tableLabel: 'Table B1',
        description: 'Demo token for Blue Door Café'
      }
    ];

    return NextResponse.json({
      tokens: demoTokens,
      message: 'Demo table tokens generated successfully'
    });

  } catch (error) {
    console.error('Dev table token error:', error);
    return NextResponse.json(
      { error: 'Failed to generate demo tokens' }, 
      { status: 500 }
    );
  }
}


