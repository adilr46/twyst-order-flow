import { supabase } from "./supabase";

export type OrderStatus = "created" | "paid" | "accepted" | "in_prep" | "served" | "cancelled";

export async function getVenueBySlug(slug: string) {
  try {
    const response = await fetch('/api/venues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug }),
      cache: 'no-store' // Ensure fresh data
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const { venue } = await response.json();
    return venue;
  } catch (error) {
    console.error('Failed to fetch venue by slug:', error);
    throw error;
  }
}

export async function listOrdersForVenue(opts: { 
  venueId: string; 
  statuses?: OrderStatus[]; 
  sinceISO?: string; 
}) {
  let q = supabase.from("orders")
    .select(`
      id, 
      status, 
      created_at, 
      session_id,
      total_cents,
      venue_id,
      subtotal_cents,
      tax_cents,
      sessions!inner(
        table_id,
        tables!inner(label)
      )
    `)
    .eq("venue_id", opts.venueId)
    .order("created_at", { ascending: false });
  
  if (opts.statuses?.length) q = q.in("status", opts.statuses);
  if (opts.sinceISO) q = q.gte("created_at", opts.sinceISO);
  
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getTableLabelBySession(sessionId: string) {
  const { data, error } = await supabase
    .from("sessions")
    .select("table_id, tables(label)")
    .eq("id", sessionId)
    .single();
  if (error || !data) return null;
  // @ts-ignore Supabase nested select shape
  return data.tables?.label ?? null;
}

export async function updateOrderStatus(orderId: string, nextStatus: OrderStatus, actor = "foh:system") {
  const { data, error } = await supabase
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", orderId)
    .select("id,status,venue_id")
    .single();
  
  if (error) throw error;

  // Log the event
  try {
    await supabase.from("event_log")
      .insert({ 
        type: `order.${nextStatus}`,
        actor, 
        payload: { 
          venue_id: data.venue_id, 
          order_id: data.id,
          previous_status: 'unknown', 
          new_status: nextStatus 
        } 
      });
  } catch (eventError) {
    // Ignore event logging errors
    console.warn('Failed to log event:', eventError);
  }
  
  return data;
}

// Helper function to log custom events
export async function logEvent(
  type: string, 
  actor: string, 
  venueId: string, 
  orderId?: string, 
  payload: any = {}
) {
  try {
    await supabase.from("event_log")
      .insert({ 
        type,
        actor, 
        payload: {
          venue_id: venueId,
          order_id: orderId,
          ...payload
        }
      });
  } catch (eventError) {
    console.warn('Failed to log event:', eventError);
  }
}

// Get events for a venue (admin view)
export async function getVenueEvents(venueId: string, limit = 50) {
  const { data, error } = await supabase
    .from("event_log")
    .select("*")
    .contains("payload", { venue_id: venueId })
    .order("ts", { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

export async function getMenuItems(venueId: string) {
  try {
    const response = await fetch(`/api/menu?venueId=${venueId}`, {
      method: 'GET',
      cache: 'no-store' // Ensure fresh data
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const { items } = await response.json();
    
    // Transform to match MenuItem interface with price_cents
    return items.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price_cents: item.price_cents, // Keep in cents format
      category: item.category || 'main',
      image: item.image_url,
      available: item.is_active,
      dietary: [] // TODO: Add dietary info field if needed
    }));
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    throw error;
  }
}