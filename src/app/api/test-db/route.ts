import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { devLog } from '@/lib/devLog';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  devLog('test-db', '🔧 Testing direct database connection...');

  try {
    const supabase = createClient(
      'http://localhost:3000',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'x-my-custom-header': 'my-app-name'
          }
        }
      }
    );

    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .limit(1);

    if (error) {
      devLog('test-db', '❌ Query error:', { error: error.message });
      return NextResponse.json({ error: 'Query failed', details: error }, { status: 500 });
    }

    devLog('test-db', '✅ Query success:', { data });
    return NextResponse.json({ data });

  } catch (error) {
    devLog('test-db', '❌ Connection error:', { error });
    return NextResponse.json(
      { error: 'Connection failed', details: error },
      { status: 500 }
    );
  }
}