import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UpdateStatusSchema = z.object({
  status: z.enum(['paid', 'in_prep', 'ready', 'served', 'cancelled']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status } = UpdateStatusSchema.parse(body);
    const orderId = params.id;

    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error('Failed to update order status:', error);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}