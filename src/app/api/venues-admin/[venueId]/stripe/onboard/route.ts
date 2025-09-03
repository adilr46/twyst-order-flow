import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import Stripe from "stripe";
import { ENV } from "@/env";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const stripe = new Stripe(ENV.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

export async function POST(
  req: NextRequest,
  { params }: { params: { venueId: string } }
) {
  try {
    const venueId = params.venueId;
    const supabase = createServerSupabaseClient();

    // Get venue details
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name, stripe_account_id')
      .eq('id', venueId)
      .single();

    if (venueError || !venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    // Create or get Stripe account
    let accountId = venue.stripe_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        business_type: 'company',
        company: {
          name: venue.name,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;

      // Save account ID
      const { error: updateError } = await supabase
        .from('venues')
        .update({ stripe_account_id: accountId })
        .eq('id', venueId);

      if (updateError) {
        console.error('Failed to save Stripe account ID:', updateError);
        return NextResponse.json(
          { error: 'Failed to save Stripe account' },
          { status: 500 }
        );
      }
    }

    // Create account link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${ENV.NEXT_PUBLIC_APP_URL}/admin/venues/${venueId}/stripe/refresh`,
      return_url: `${ENV.NEXT_PUBLIC_APP_URL}/admin/venues/${venueId}/stripe/return`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });

  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}