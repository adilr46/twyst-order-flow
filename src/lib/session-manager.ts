import { supabase } from '@/lib/supabase';
import * as tokenUtils from '@/utils/token';

// Session storage keys
const SESSION_STORAGE_PREFIX = 'twyst:session:';

export interface TableSession {
  sessionId: string;
  venue: string;
  venueId: string;
  table: string;
  token: string;
}

/**
 * Store session data in sessionStorage for recovery
 */
export function storeSessionData(venueSlug: string, session: TableSession) {
  if (typeof window === 'undefined') return;
  const key = `${SESSION_STORAGE_PREFIX}${venueSlug}`;
  sessionStorage.setItem(key, JSON.stringify(session));
}

/**
 * Get stored session data from sessionStorage
 */
export function getStoredSessionData(venueSlug: string): TableSession | null {
  if (typeof window === 'undefined') return null;
  const key = `${SESSION_STORAGE_PREFIX}${venueSlug}`;
  const data = sessionStorage.getItem(key);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse stored session data:', e);
    return null;
  }
}

/**
 * Clear stored session data from sessionStorage
 */
export function clearStoredSessionData(venueSlug: string) {
  if (typeof window === 'undefined') return;
  const key = `${SESSION_STORAGE_PREFIX}${venueSlug}`;
  sessionStorage.removeItem(key);
}

/**
 * Recover session from storage if available
 */
export function recoverSessionFromStorage(venueSlug: string): TableSession | null {
  return getStoredSessionData(venueSlug);
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(sessionId: string) {
  const { error } = await supabase
    .from('sessions')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    console.warn('Failed to update session activity:', error);
  }
}