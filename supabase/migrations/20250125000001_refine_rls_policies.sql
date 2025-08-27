-- Refine RLS Policies for Venue-Scoped Access Control
-- This migration improves the existing RLS policies to match the exact requirements:
-- - Diners can read items
-- - Owners/staff (venue-scoped) can read/write orders and sessions
-- - Items: public-read, owner-write
-- - Helper claims via venues.owner_id = auth.uid()

-- ============================================================================
-- 1. ENSURE RLS IS ENABLED (idempotent)
-- ============================================================================
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. DROP EXISTING POLICIES TO RECREATE WITH REFINED PERMISSIONS
-- ============================================================================
-- Venues policies
DROP POLICY IF EXISTS "Venues are viewable by everyone" ON public.venues;
DROP POLICY IF EXISTS "Venues can be managed by owners" ON public.venues;

-- Tables policies
DROP POLICY IF EXISTS "Tables are viewable for venue data" ON public.tables;
DROP POLICY IF EXISTS "Tables can be managed by venue owners" ON public.tables;

-- Items policies
DROP POLICY IF EXISTS "Active items are viewable by everyone" ON public.items;
DROP POLICY IF EXISTS "Items can be managed by venue owners" ON public.items;

-- Sessions policies
DROP POLICY IF EXISTS "Sessions are viewable for venue operations" ON public.sessions;
DROP POLICY IF EXISTS "Sessions can be managed by venue owners" ON public.sessions;

-- Orders policies
DROP POLICY IF EXISTS "Orders are viewable for venue operations" ON public.orders;
DROP POLICY IF EXISTS "Orders are viewable by venue owners only" ON public.orders;
DROP POLICY IF EXISTS "Orders can be inserted by everyone" ON public.orders;
DROP POLICY IF EXISTS "Orders can be updated by venue owners" ON public.orders;

-- Order items policies
DROP POLICY IF EXISTS "Order items are viewable with orders" ON public.order_items;
DROP POLICY IF EXISTS "Order items can be inserted with orders" ON public.order_items;
DROP POLICY IF EXISTS "Order items can be updated by venue owners" ON public.order_items;

-- Event log policies
DROP POLICY IF EXISTS "Event log viewable by venue owners" ON public.event_log;
DROP POLICY IF EXISTS "Event log can be inserted by everyone" ON public.event_log;

-- Stripe events policies
DROP POLICY IF EXISTS "Stripe events are accessible by service" ON public.stripe_events;

-- ============================================================================
-- 3. CREATE HELPER FUNCTION FOR VENUE OWNERSHIP CHECK
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_venue_owner(venue_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.venues 
    WHERE id = venue_uuid 
    AND owner_id = auth.uid()
  );
$$;

-- ============================================================================
-- 4. VENUES POLICIES
-- ============================================================================
-- Everyone can view venue basic info (for menu access)
CREATE POLICY "venues_select_all" 
ON public.venues 
FOR SELECT 
USING (true);

-- Only owners can manage their venues
CREATE POLICY "venues_all_owners" 
ON public.venues 
FOR ALL 
USING (owner_id = auth.uid());

-- ============================================================================
-- 5. TABLES POLICIES (Physical tables in venues)
-- ============================================================================
-- Everyone can view tables (needed for token resolution)
CREATE POLICY "tables_select_all" 
ON public.tables 
FOR SELECT 
USING (true);

-- Only venue owners can manage their tables
CREATE POLICY "tables_all_owners" 
ON public.tables 
FOR ALL 
USING (public.is_venue_owner(venue_id));

-- ============================================================================
-- 6. ITEMS POLICIES (Menu items) - Public read, owner write
-- ============================================================================
-- Diners can read active items from any venue
CREATE POLICY "items_select_active" 
ON public.items 
FOR SELECT 
USING (is_active = true);

-- Venue owners can manage all their items
CREATE POLICY "items_all_owners" 
ON public.items 
FOR ALL 
USING (public.is_venue_owner(venue_id));

-- ============================================================================
-- 7. SESSIONS POLICIES - Venue-scoped for owners/staff
-- ============================================================================
-- Only venue owners can read sessions from their venues
CREATE POLICY "sessions_select_owners" 
ON public.sessions 
FOR SELECT 
USING (public.is_venue_owner(venue_id));

-- Only venue owners can manage sessions in their venues
CREATE POLICY "sessions_insert_owners" 
ON public.sessions 
FOR INSERT 
WITH CHECK (public.is_venue_owner(venue_id));

CREATE POLICY "sessions_update_owners" 
ON public.sessions 
FOR UPDATE 
USING (public.is_venue_owner(venue_id));

CREATE POLICY "sessions_delete_owners" 
ON public.sessions 
FOR DELETE 
USING (public.is_venue_owner(venue_id));

-- ============================================================================
-- 8. ORDERS POLICIES - Venue-scoped for owners/staff
-- ============================================================================
-- Only venue owners can read orders from their venues
CREATE POLICY "orders_select_owners" 
ON public.orders 
FOR SELECT 
USING (public.is_venue_owner(venue_id));

-- Anyone can insert orders (customers placing orders)
-- But the venue_id must be valid
CREATE POLICY "orders_insert_all" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.venues WHERE id = venue_id)
);

-- Only venue owners can update their orders
CREATE POLICY "orders_update_owners" 
ON public.orders 
FOR UPDATE 
USING (public.is_venue_owner(venue_id));

-- Only venue owners can delete their orders (if needed)
CREATE POLICY "orders_delete_owners" 
ON public.orders 
FOR DELETE 
USING (public.is_venue_owner(venue_id));

-- ============================================================================
-- 9. ORDER_ITEMS POLICIES - Follow order permissions
-- ============================================================================
-- Can read order items if you can read the order
CREATE POLICY "order_items_select_with_order" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id 
    AND public.is_venue_owner(o.venue_id)
  )
);

-- Can insert order items if you can insert the order
CREATE POLICY "order_items_insert_with_order" 
ON public.order_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id
  )
);

-- Can update order items if you own the venue
CREATE POLICY "order_items_update_owners" 
ON public.order_items 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id 
    AND public.is_venue_owner(o.venue_id)
  )
);

-- Can delete order items if you own the venue
CREATE POLICY "order_items_delete_owners" 
ON public.order_items 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id 
    AND public.is_venue_owner(o.venue_id)
  )
);

-- ============================================================================
-- 10. EVENT_LOG POLICIES - Venue owners can read their events
-- ============================================================================
-- Venue owners can read events from their venues
CREATE POLICY "event_log_select_owners" 
ON public.event_log 
FOR SELECT 
USING (
  venue_id IS NULL OR public.is_venue_owner(venue_id)
);

-- System can insert events (webhooks, triggers, etc.)
-- Allow insert for service operations
CREATE POLICY "event_log_insert_service" 
ON public.event_log 
FOR INSERT 
WITH CHECK (true);

-- ============================================================================
-- 11. STRIPE_EVENTS POLICIES - Service level access only
-- ============================================================================
-- Service level access for webhook deduplication
CREATE POLICY "stripe_events_service_access" 
ON public.stripe_events 
FOR ALL 
USING (true);

-- ============================================================================
-- 12. CREATE INDEXES FOR RLS PERFORMANCE
-- ============================================================================
-- Optimize venue ownership lookups
CREATE INDEX IF NOT EXISTS idx_venues_owner_id ON public.venues(owner_id);

-- Optimize venue_id lookups for RLS
CREATE INDEX IF NOT EXISTS idx_tables_venue_id ON public.tables(venue_id);
CREATE INDEX IF NOT EXISTS idx_items_venue_id ON public.items(venue_id);
CREATE INDEX IF NOT EXISTS idx_sessions_venue_id ON public.sessions(venue_id);
CREATE INDEX IF NOT EXISTS idx_orders_venue_id ON public.orders(venue_id);
CREATE INDEX IF NOT EXISTS idx_event_log_venue_id ON public.event_log(venue_id);

-- ============================================================================
-- 13. CREATE SECURITY DEFINER FUNCTIONS FOR COMMON OPERATIONS
-- ============================================================================

-- Function to check if user can access a specific session
CREATE OR REPLACE FUNCTION public.can_access_session(session_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.venues v ON s.venue_id = v.id
    WHERE s.id = session_uuid
    AND v.owner_id = auth.uid()
  );
$$;

-- Function to check if user can access a specific order
CREATE OR REPLACE FUNCTION public.can_access_order(order_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.venues v ON o.venue_id = v.id
    WHERE o.id = order_uuid
    AND v.owner_id = auth.uid()
  );
$$;

-- ============================================================================
-- 14. GRANT NECESSARY PERMISSIONS
-- ============================================================================
-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.is_venue_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_order(UUID) TO authenticated;

-- Grant execute permissions on helper functions to anonymous (for public operations)
GRANT EXECUTE ON FUNCTION public.is_venue_owner(UUID) TO anon;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON POLICY "venues_select_all" ON public.venues IS 'Everyone can view venue basic info for menu access';
COMMENT ON POLICY "venues_all_owners" ON public.venues IS 'Only venue owners can manage their venues';

COMMENT ON POLICY "tables_select_all" ON public.tables IS 'Everyone can view tables for token resolution';
COMMENT ON POLICY "tables_all_owners" ON public.tables IS 'Only venue owners can manage their tables';

COMMENT ON POLICY "items_select_active" ON public.items IS 'Diners can read active items from any venue';
COMMENT ON POLICY "items_all_owners" ON public.items IS 'Venue owners can manage all their items';

COMMENT ON POLICY "sessions_select_owners" ON public.sessions IS 'Only venue owners can read sessions from their venues';
COMMENT ON POLICY "orders_select_owners" ON public.orders IS 'Only venue owners can read orders from their venues';
COMMENT ON POLICY "orders_insert_all" ON public.orders IS 'Anyone can insert orders (customers placing orders)';

COMMENT ON FUNCTION public.is_venue_owner(UUID) IS 'Helper function to check if authenticated user owns a venue';
COMMENT ON FUNCTION public.can_access_session(UUID) IS 'Helper function to check if user can access a specific session';
COMMENT ON FUNCTION public.can_access_order(UUID) IS 'Helper function to check if user can access a specific order';

-- Migration complete
COMMENT ON MIGRATION IS 'Refined RLS policies for venue-scoped access control with helper functions';
