import { NextRequest, NextResponse } from 'next/server';
import { ENV } from '@/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function demoPayload() {
  return {
    tokens: [
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
    ],
    message: 'Demo table tokens generated successfully'
  };
}

export async function GET(req: NextRequest) {
  try {
    // Only allow in development or when demo mode is explicitly enabled
    const isProduction = ENV.NODE_ENV === 'production';
    const isDemoMode = ENV.DEMO_MODE === 'true';
    
    if (isProduction && !isDemoMode) {
      return NextResponse.json(
        { error: 'Demo access not available in production' }, 
        { status: 403 }
      );
    }

    return NextResponse.json(demoPayload());

  } catch (error) {
    console.error('Dev table token error:', error);
    return NextResponse.json(
      { error: 'Failed to generate demo tokens' }, 
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const isProduction = ENV.NODE_ENV === 'production';
    const isDemoMode = ENV.DEMO_MODE === 'true';
    
    if (isProduction && !isDemoMode) {
      return NextResponse.json(
        { error: 'Demo access not available in production' }, 
        { status: 403 }
      );
    }

    return NextResponse.json(demoPayload());
  } catch (error) {
    console.error('Dev table token POST error:', error);
    return NextResponse.json(
      { error: 'Failed to generate demo tokens' }, 
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
    },
  });
}


