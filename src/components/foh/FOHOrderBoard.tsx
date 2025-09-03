"use client";

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronRight, RefreshCw } from 'lucide-react';
import OrderItemsPopover from '@/components/foh/OrderItemsPopover';
import { supabase } from '@/lib/supabase';

type Step = 'created' | 'paid' | 'accepted' | 'in_prep' | 'ready' | 'served' | 'cancelled';

const NEXT: Record<Step, Step | null> = {
  created: 'paid', // Order created but not paid
  paid: 'accepted',
  accepted: 'in_prep',
  in_prep: 'ready',
  ready: 'served',
  served: null,
  cancelled: null,
};

const STATUS_COLORS: Record<Step, string> = {
  created: 'bg-gray-100 text-gray-800',
  paid: 'bg-blue-100 text-blue-800',
  accepted: 'bg-yellow-100 text-yellow-800',
  in_prep: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  served: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

type OrderItemLite = { 
  quantity: number; 
  unit_price_cents: number; 
  items?: { name?: string | null } | null 
};

type OrderLite = {
  id: string;
  status: Step;
  created_at: string;
  total_cents: number;
  sessions?: { tables?: { label?: string | null } | null } | null;
  order_items?: OrderItemLite[] | null;
};

export default function FOHOrderBoard({ venueSlug }: { venueSlug: string }) {
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/foh/orders/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueSlug }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load FOH orders');
      setOrders(json.orders || []);
    } catch (e) {
      console.error('Error fetching FOH orders:', e);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // ✅ Fix Issue #10-12: Realtime with venue filtering
    const setupRealtime = async () => {
      // First, get the venue ID for filtering
      const venueResponse = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: venueSlug })
      });
      
      let venueId: string | null = null;
      if (venueResponse.ok) {
        const venueData = await venueResponse.json();
        venueId = venueData.venue?.id;
      }

      // Set up Realtime subscription with venue filtering
      const channel = supabase
        .channel(`foh-orders-${venueSlug}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: venueId ? `venue_id=eq.${venueId}` : undefined // ✅ Venue-specific filtering
          },
          async (payload) => {
            console.log('Realtime order update for venue:', venueSlug, payload);
            // Refresh orders when venue-specific orders change
            await fetchOrders(false);
          }
        )
        .subscribe((status) => {
          console.log('FOH Realtime subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Realtime connected for venue: ${venueSlug}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('⚠️ Realtime connection failed, using polling fallback');
          }
        });

      return channel;
    };

    // Initialize realtime connection
    let channel: any = null;
    setupRealtime().then(ch => { channel = ch; });

    // ✅ Reduced polling to 15 seconds (since we have realtime)
    const pollInterval = setInterval(() => fetchOrders(false), 15000);
    
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
      clearInterval(pollInterval);
    };
  }, [venueSlug]);

  const grouped = useMemo(() => {
    const map: Record<string, OrderLite[]> = { created: [], paid: [], accepted: [], in_prep: [], ready: [] };
    orders.forEach(o => {
      if (['created', 'paid', 'accepted', 'in_prep', 'ready'].includes(o.status)) {
        map[o.status].push(o);
      }
    });
    return map;
  }, [orders]);

  const advance = async (order: OrderLite) => {
    const next = NEXT[order.status];
    if (!next) return;
    
    setBusy(order.id);
    // Optimistic update
    setOrders(prev => prev.map(o => (o.id === order.id ? { ...o, status: next } : o)));
    
    try {
      const res = await fetch(`/api/foh/orders/${order.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      
      if (!res.ok) {
        // Revert optimistic update
        setOrders(prev => prev.map(o => (o.id === order.id ? { ...o, status: order.status } : o)));
        const json = await res.json();
        console.error('Failed to update order status:', json.error);
      }
    } catch (e) {
      console.error('Error updating order status:', e);
      // Revert optimistic update
      setOrders(prev => prev.map(o => (o.id === order.id ? { ...o, status: order.status } : o)));
    } finally {
      setBusy(null);
    }
  };

  const Column = ({ title, statusKey }: { title: string; statusKey: 'paid'|'accepted'|'in_prep'|'ready' }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize">{title.replace('_', ' ')}</h2>
        <Badge variant="secondary" className="rounded-full">
          {grouped[statusKey].length}
        </Badge>
      </div>
      <div className="space-y-3">
        {grouped[statusKey].map(o => {
          const itemRows = (o.order_items ?? []).map(i => ({ 
            qty: i.quantity, 
            name: i.items?.name ?? 'Item' 
          }));
          const table = o.sessions?.tables?.label ? `Table ${o.sessions.tables.label}` : '—';
          const next = NEXT[o.status];
          const orderTime = new Date(o.created_at).toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          return (
            <Card key={o.id} className="rounded-2xl shadow-sm border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="font-semibold">#{String(o.id).slice(-6)}</span>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs rounded-full ${STATUS_COLORS[o.status]}`}>
                      {o.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardTitle>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{table}</span>
                  <span>{orderTime}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <OrderItemsPopover items={itemRows} />
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">£{(o.total_cents/100).toFixed(2)}</span>
                  {next ? (
                    <Button
                      size="sm"
                      className="rounded-xl bg-blue-600 hover:bg-blue-700"
                      onClick={() => advance(o)}
                      disabled={busy === o.id}
                    >
                      {busy === o.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-2" />
                      )}
                      Mark {next.replace('_', ' ')}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground px-3 py-1 bg-gray-100 rounded-full">
                      Completed
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {grouped[statusKey].length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No {title.toLowerCase()} orders</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading orders…</span>
        </div>
      </div>
    );
  }

  const totalOrders = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FOH Dashboard</h1>
          <p className="text-muted-foreground">
            {venueSlug} • {totalOrders} active orders
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="rounded-xl"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Column title="Paid" statusKey="paid" />
        <Column title="Accepted" statusKey="accepted" />
        <Column title="In Prep" statusKey="in_prep" />
        <Column title="Ready" statusKey="ready" />
      </div>
    </div>
  );
}

