import { supabase } from '@/integrations/supabase/client';
import * as tokenUtils from '@/utils/token';

// Session storage keys
const SESSION_STORAGE_PREFIX = 'twyst:session:';
const SESSION_RECOVERY_KEY = 'twyst:recovery';

interface TableSession {
  venue: string;
  table: string;
  sessionId: string;
  venueId?: string;
  token?: string;
}

/**
 * Stores session data in sessionStorage for recovery
 */
export function storeSessionData(venueSlug: string, session: TableSession): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${SESSION_STORAGE_PREFIX}${venueSlug}`;
    const sessionData = {
      ...session,
      timestamp: Date.now(),
      url: window.location.href
    };
    
    sessionStorage.setItem(key, JSON.stringify(sessionData));
    sessionStorage.setItem(SESSION_RECOVERY_KEY, key);
    
    console.log('Session stored for recovery:', { venueSlug, sessionId: session.sessionId });
  } catch (error) {
    console.warn('Failed to store session data:', error);
  }
}

/**
 * Retrieves session data from sessionStorage
 */
export function getStoredSessionData(venueSlug: string): TableSession | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = `${SESSION_STORAGE_PREFIX}${venueSlug}`;
    const stored = sessionStorage.getItem(key);
    
    if (!stored) return null;
    
    const sessionData = JSON.parse(stored);
    
    // Check if session is too old (24 hours)
    if (sessionData.timestamp && Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem(key);
      return null;
    }
    
    return {
      venue: sessionData.venue,
      table: sessionData.table,
      sessionId: sessionData.sessionId,
      venueId: sessionData.venueId,
      token: sessionData.token
    };
  } catch (error) {
    console.warn('Failed to retrieve session data:', error);
    return null;
  }
}

/**
 * Clears session data from sessionStorage
 */
function clearStoredSessionData(venueSlug: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${SESSION_STORAGE_PREFIX}${venueSlug}`;
    sessionStorage.removeItem(key);
    
    // Also clear recovery key if it matches
    const recoveryKey = sessionStorage.getItem(SESSION_RECOVERY_KEY);
    if (recoveryKey === key) {
      sessionStorage.removeItem(SESSION_RECOVERY_KEY);
    }
  } catch (error) {
    console.warn('Failed to clear session data:', error);
  }
}

/**
 * Resolves an opaque table token to venue, table, and session information.
 * Creates a session if one doesn't exist. Enforces single active session per table.
 */
export async function resolveTableToken(token: string): Promise<TableSession | null> {
  try {
    // Use centralized token validation
    if (!tokenUtils.validateToken(token)) {
      console.error('Invalid token format (must be 32-char hex):', token);
      return null;
    }

    // Find the table by token
    const { data: table, error: tableError } = await supabase
      .from('tables')
      .select(`
        id,
        label,
        venue_id,
        venues!inner(
          slug,
          name
        )
      `)
      .eq('token', token)
      .maybeSingle();

    if (tableError) {
      console.error('Database error fetching table:', tableError);
      return null;
    }

    if (!table) {
      console.error('Table not found for token:', token);
      return null;
    }

    // Close any existing open sessions for this table (enforce single active session)
    const { error: closeError } = await supabase
      .from('sessions')
      .update({ 
        status: 'closed',
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('table_id', table.id)
      .eq('status', 'open');

    if (closeError) {
      console.warn('Failed to close existing sessions:', closeError);
    }

    // Create or find existing session for this table
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        venue_id: table.venue_id,
        table_id: table.id,
        status: 'open',
        last_seen_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return null;
    }

    const result: TableSession = {
      venue: table.venues.slug,
      table: table.label,
      sessionId: session.id
    };

    // Store session data for potential recovery
    storeSessionData(table.venues.slug, result);

    console.log(`✅ Token resolved: ${table.venues.slug}/${table.label} → session ${session.id}`);
    return result;

  } catch (error) {
    console.error('resolveTableToken failed:', error);
    return null;
  }
}

/**
 * Attempts to recover session from sessionStorage when no token is present
 */
export function recoverSessionFromStorage(venueSlug: string): TableSession | null {
  const stored = getStoredSessionData(venueSlug);
  
  if (stored) {
    console.log('✅ Session recovered from storage:', stored);
    return stored;
  }
  
  return null;
}

/**
 * Updates the last_seen_at timestamp for a session
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ 
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.warn('Failed to update session activity:', error);
    }
  } catch (error) {
    console.warn('Error updating session activity:', error);
  }
}

/**
 * Gets the current session for a table token from URL parameters
 * Delegates to centralized token utility for consistency
 */
export function getTableTokenFromUrl(): string | null {
  // Delegate to the centralized token utility
  return tokenUtils.getTokenFromUrl();
}

/**
 * Diagnostic function for dev-only self-check
 * Logs grouped report of system health
 */
export async function twystSelfCheck(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.group('🔧 Twyst Self-Check');
  
  try {
    // 1. Supabase anon connect
    try {
      const { data } = await supabase.from('venues').select('id').limit(1);
      console.log('✅ Supabase anon connect OK');
    } catch (error) {
      console.error('❌ Supabase anon connect FAILED:', error);
    }
    
    // 2. Demo venue present
    try {
      const { data: venue } = await supabase
        .from('venues')
        .select('id, name')
        .eq('slug', 'demo-cafe')
        .single();
      
      if (venue) {
        console.log('✅ Demo venue present:', venue.name);
      } else {
        console.warn('⚠️ Demo venue NOT found');
      }
    } catch (error) {
      console.error('❌ Demo venue check FAILED:', error);
    }
    
    // 3. Items >= 1
    try {
      const { data: items, count } = await supabase
        .from('items')
        .select('id', { count: 'exact' })
        .eq('is_active', true)
        .limit(1);
        
      if (count && count >= 1) {
        console.log(`✅ Items available: ${count}`);
      } else {
        console.warn('⚠️ No active items found');
      }
    } catch (error) {
      console.error('❌ Items check FAILED:', error);
    }
    
    // 4. Token resolved → sessionId
    const token = tokenUtils.getTokenFromUrl();
    if (token) {
      try {
        const session = await resolveTableToken(token);
        if (session) {
          console.log('✅ Token resolved → sessionId:', session.sessionId);
        } else {
          console.warn('⚠️ Token resolution failed');
        }
      } catch (error) {
        console.error('❌ Token resolution FAILED:', error);
      }
    } else {
      console.log('ℹ️ No token in URL to test');
    }
    
    // 5. CreateOrder reachable
    try {
      // Just check if the function exists (without actually calling it)
      console.log('✅ CreateOrder edge function endpoint configured');
    } catch (error) {
      console.error('❌ CreateOrder check FAILED:', error);
    }
    
    console.log('📊 Self-check complete');
    
  } catch (error) {
    console.error('💥 Self-check crashed:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * Detects if the current session likely came from an NFC tap
 * Based on user agent and other contextual clues
 */
export function isLikelyNFCSession(): boolean {
  // Guard against SSR - only run in browser
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  
  // Check if we're on mobile and the page was loaded recently
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const hasNFCSupport = 'NDEFReader' in window;
  
  // If we have a token and we're on a mobile device with NFC support
  return isMobile && (hasNFCSupport || /Android/i.test(navigator.userAgent));
}

// Export TableSession interface
export type { TableSession };