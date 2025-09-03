import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import Stripe from 'stripe';
import { ENV } from '@/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      stripe: 'unknown'
    }
  };

  try {
    // Check database
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('venues')
      .select('count')
      .limit(1);

    health.services.database = error ? 'error' : 'ok';

    // Check Stripe if configured
    if (ENV.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(ENV.STRIPE_SECRET_KEY, {
        apiVersion: '2025-08-27.basil',
        typescript: true,
      });

      await stripe.balance.retrieve();
      health.services.stripe = 'ok';
    }

  } catch (error) {
    console.error('Health check failed:', error);
    health.status = 'error';
  }

  return NextResponse.json(health);
}