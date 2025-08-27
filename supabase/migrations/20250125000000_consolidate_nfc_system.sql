-- Consolidation Migration: NFC Token System with Session Management
-- This migration ensures all required components are in place and properly configured
-- Most components already exist from previous migrations - this serves as verification and documentation

-- ============================================================================
-- 1. ENSURE ENUMS EXIST
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('open', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('created', 'paid', 'accepted', 'in_prep', 'ready', 'served', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. ENSURE TABLES HAVE REQUIRED COLUMNS
-- ============================================================================

-- Ensure tables table has token (unique) and optional nfc_uid
-- These should already exist from previous migrations
ALTER TABLE public.tables 
ADD COLUMN IF NOT EXISTS token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS nfc_uid TEXT UNIQUE;

-- Create unique indexes if they don't exist (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS tables_token_unique ON public.tables(token);
CREATE UNIQUE INDEX IF NOT EXISTS tables_nfc_uid_unique ON public.tables(nfc_uid) WHERE nfc_uid IS NOT NULL;

-- ============================================================================
-- 3. ENSURE SESSIONS TABLE IS COMPLETE
-- ============================================================================

-- Ensure sessions table has all required fields
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- 4. ENSURE ORDERS TABLE HAS SESSION_ID FK
-- ============================================================================

-- Ensure orders has session_id FK and updated_at
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Remove table_label column if it exists (replaced by session relationship)
ALTER TABLE public.orders DROP COLUMN IF EXISTS table_label;

-- ============================================================================
-- 5. ENSURE EVENT_LOG TABLE EXISTS
-- ============================================================================

-- Create event_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ts TIMESTAMPTZ DEFAULT now(),
    actor TEXT,
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    type TEXT,
    payload JSONB
);

-- ============================================================================
-- 6. ENSURE ORDER STATUS TRANSITION TRIGGER EXISTS
-- ============================================================================

-- Create function to enforce legal order transitions
CREATE OR REPLACE FUNCTION public.enforce_order_transitions()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only check status transitions if status is being changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Define legal transitions
    IF (OLD.status = 'created' AND NEW.status NOT IN ('paid', 'cancelled')) OR
       (OLD.status = 'paid' AND NEW.status NOT IN ('accepted', 'cancelled')) OR
       (OLD.status = 'accepted' AND NEW.status NOT IN ('in_prep', 'cancelled')) OR
       (OLD.status = 'in_prep' AND NEW.status NOT IN ('ready', 'cancelled')) OR
       (OLD.status = 'ready' AND NEW.status NOT IN ('served', 'cancelled')) OR
       (OLD.status IN ('served', 'cancelled') AND NEW.status != OLD.status) THEN
      
      RAISE EXCEPTION 'Invalid order status transition from % to %', OLD.status, NEW.status;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for order transitions
DROP TRIGGER IF EXISTS enforce_order_transitions_trigger ON public.orders;
CREATE TRIGGER enforce_order_transitions_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_order_transitions();

-- ============================================================================
-- 7. ENSURE ONE OPEN SESSION PER TABLE TRIGGER EXISTS
-- ============================================================================

-- Create function to enforce one open session per table
CREATE OR REPLACE FUNCTION public.enforce_one_open_session_per_table()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Check if there's already an open session for this table
    IF NEW.status = 'open' AND EXISTS (
        SELECT 1 FROM public.sessions 
        WHERE table_id = NEW.table_id 
        AND status = 'open' 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        RAISE EXCEPTION 'Table already has an open session. Only one open session per table is allowed.';
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for one open session per table
DROP TRIGGER IF EXISTS enforce_one_open_session_trigger ON public.sessions;
CREATE TRIGGER enforce_one_open_session_trigger
  BEFORE INSERT OR UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_one_open_session_per_table();

-- ============================================================================
-- 8. ENSURE UPDATED_AT TRIGGERS EXIST
-- ============================================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Create updated_at triggers
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 9. ENSURE LAST_SEEN_AT TRIGGER EXISTS
-- ============================================================================

-- Create function to update last_seen_at on session access
CREATE OR REPLACE FUNCTION public.update_session_last_seen()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update if it's been more than 5 minutes since last update
  -- to avoid too frequent updates
  IF OLD.last_seen_at IS NULL OR OLD.last_seen_at < now() - interval '5 minutes' THEN
    NEW.last_seen_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for last_seen_at updates
DROP TRIGGER IF EXISTS update_sessions_last_seen ON public.sessions;
CREATE TRIGGER update_sessions_last_seen
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_last_seen();

-- ============================================================================
-- 10. ENSURE STRIPE_EVENTS TABLE EXISTS (for webhook deduplication)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stripe_events (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    attempt_count INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ NULL
);

-- ============================================================================
-- 11. CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Core indexes for performance
CREATE INDEX IF NOT EXISTS idx_venues_slug ON public.venues(slug);
CREATE INDEX IF NOT EXISTS idx_tables_token ON public.tables(token);
CREATE INDEX IF NOT EXISTS idx_tables_nfc_uid ON public.tables(nfc_uid) WHERE nfc_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_table_status ON public.sessions(table_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_venue_status ON public.sessions(venue_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_session_status ON public.orders(session_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_venue_status_created ON public.orders(venue_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON public.orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_log_venue_type ON public.event_log(venue_id, type);
CREATE INDEX IF NOT EXISTS idx_event_log_order ON public.event_log(order_id) WHERE order_id IS NOT NULL;

-- ============================================================================
-- 12. CREATE HELPER FUNCTION FOR TOKEN GENERATION
-- ============================================================================

-- Function to generate secure random table tokens
CREATE OR REPLACE FUNCTION public.generate_table_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Generate a 32-character hex token (128 bits of entropy)
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$function$;

-- ============================================================================
-- VERIFICATION QUERIES (commented out for production)
-- ============================================================================

-- Uncomment these to verify the migration worked correctly:
-- SELECT 'Tables with tokens: ' || count(*) FROM public.tables WHERE token IS NOT NULL;
-- SELECT 'Active sessions: ' || count(*) FROM public.sessions WHERE status = 'open';
-- SELECT 'Order transition trigger exists: ' || count(*) FROM information_schema.triggers WHERE trigger_name = 'enforce_order_transitions_trigger';
-- SELECT 'Session constraint trigger exists: ' || count(*) FROM information_schema.triggers WHERE trigger_name = 'enforce_one_open_session_trigger';

-- Migration complete - NFC token system with session management is ready
COMMENT ON MIGRATION IS 'Consolidates NFC token system with session management, order status transitions, and webhook deduplication';



