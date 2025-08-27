import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { listOrdersForVenue, updateOrderStatus, getTableLabelBySession, type OrderStatus } from "@/lib/data-layer";

export type FOHOrder = {
  id: string;
  status: OrderStatus;
  created_at: string;
  session_id: string | null;
  total_cents: number;
  subtotal_cents: number | null;
  tax_cents: number | null;
  venue_id: string;
  table_label?: string | null;
  sessions?: {
    table_id: string;
    tables: {
      label: string;
    };
  };
};

export type ConnectionState = {
  isConnected: boolean;
  lastEventTime: number;
  reconnectedCallback?: () => void;
};

export function useOrders(venueId?: string, opts?: { subscribe?: boolean; onConnectionChange?: (state: ConnectionState) => void }) {
  const [orders, setOrders] = useState<FOHOrder[]>([]);
  const [loading, setLoading] = useState(!!venueId);
  const [error, setError] = useState<unknown>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: true,
    lastEventTime: Date.now()
  });
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionCheckRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<number>(10000); // Start with 10s
  const maxPollInterval = 60000; // Max 60s
  const minPollInterval = 10000; // Min 10s

  const updateConnectionState = useCallback((isConnected: boolean, fromRealtime: boolean = false) => {
    const now = Date.now();
    const wasConnected = connectionState.isConnected;
    
    const newState: ConnectionState = {
      isConnected,
      lastEventTime: fromRealtime ? now : connectionState.lastEventTime,
      reconnectedCallback: connectionState.reconnectedCallback
    };
    
    setConnectionState(newState);
    
    // Notify parent component of connection changes
    if (opts?.onConnectionChange) {
      opts.onConnectionChange(newState);
    }
    
    // Reset polling interval on successful realtime event
    if (fromRealtime && !wasConnected && isConnected) {
      pollIntervalRef.current = minPollInterval;
    }
  }, [connectionState, opts]);

  const load = useCallback(async (fromPolling: boolean = false) => {
    if (!venueId) return;
    if (!fromPolling) setLoading(true);
    
    try {
      const todayISO = new Date(new Date().setHours(0,0,0,0)).toISOString();
      const rows = await listOrdersForVenue({ 
        venueId, 
        statuses: ["paid","accepted","in_prep","served"], // Removed "created" - FOH only sees paid+ orders
        sinceISO: todayISO 
      });
      
      const enriched: FOHOrder[] = rows.map((r: any) => ({
        ...r,
        table_label: r.sessions?.tables?.label || null
      }));
      setOrders(enriched);
      
      // Reset polling interval on successful poll
      if (fromPolling) {
        pollIntervalRef.current = minPollInterval;
        updateConnectionState(true, false);
      }
      
    } catch (e) { 
      setError(e);
      
      // Increase polling interval on error (exponential backoff)
      if (fromPolling) {
        pollIntervalRef.current = Math.min(pollIntervalRef.current * 1.5, maxPollInterval);
        updateConnectionState(false, false);
      }
    }
    finally { 
      if (!fromPolling) setLoading(false); 
    }
  }, [venueId, updateConnectionState]);

  useEffect(() => { load(); }, [load]);

  // Auto-polling with exponential backoff when no events for 15s
  const scheduleNextPoll = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }
    
    pollTimeoutRef.current = setTimeout(() => {
      const timeSinceLastEvent = Date.now() - connectionState.lastEventTime;
      if (timeSinceLastEvent > 15000) { // 15 seconds without events
        load(true); // Poll with fromPolling = true
      }
      scheduleNextPoll(); // Schedule next check
    }, pollIntervalRef.current);
  }, [connectionState.lastEventTime, load]);

  // Connection monitoring
  const startConnectionMonitoring = useCallback(() => {
    if (connectionCheckRef.current) {
      clearInterval(connectionCheckRef.current);
    }
    
    connectionCheckRef.current = setInterval(() => {
      const timeSinceLastEvent = Date.now() - connectionState.lastEventTime;
      const isCurrentlyConnected = timeSinceLastEvent < 20000; // Consider disconnected after 20s
      
      if (isCurrentlyConnected !== connectionState.isConnected) {
        updateConnectionState(isCurrentlyConnected, false);
      }
    }, 5000); // Check every 5 seconds
  }, [connectionState, updateConnectionState]);

  useEffect(() => {
    if (!venueId || !opts?.subscribe) return;
    
    const ch = supabase.channel(`venue-${venueId}-orders`).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders", filter: `venue_id=eq.${venueId}` },
      async () => { 
        await load(); 
        updateConnectionState(true, true); // Mark as connected with realtime event
      }
    ).subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Real-time subscription active for venue:', venueId);
        updateConnectionState(true, true);
      } else if (status === 'CHANNEL_ERROR') {
        console.warn('Real-time subscription error, relying on polling');
        updateConnectionState(false, false);
      }
    });
    
    channelRef.current = ch;
    
    // Start polling and connection monitoring
    scheduleNextPoll();
    startConnectionMonitoring();
    
    return () => { 
      ch.unsubscribe(); 
      channelRef.current = null;
      
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
        connectionCheckRef.current = null;
      }
    };
  }, [venueId, opts?.subscribe, load, updateConnectionState, scheduleNextPoll, startConnectionMonitoring]);

  const setStatus = useCallback(async (orderId: string, next: OrderStatus) => {
    const prev = orders;
    setOrders(os => os.map(o => o.id === orderId ? ({ ...o, status: next }) : o));
    try { 
      await updateOrderStatus(orderId, next, "foh:system");
      updateConnectionState(true, true); // Mark as connected after successful update
    }
    catch (e) { 
      setOrders(prev); 
      setError(e); 
      throw e; 
    }
  }, [orders, updateConnectionState]);

  const refresh = useCallback(() => {
    load(false); // Manual refresh, not from polling
    pollIntervalRef.current = minPollInterval; // Reset polling interval
  }, [load]);

  return { 
    orders, 
    loading, 
    error, 
    refresh, 
    setStatus, 
    connectionState,
    isConnected: connectionState.isConnected,
    lastEventTime: connectionState.lastEventTime
  };
}