"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { resolveTableToken, recoverSessionFromStorage, updateSessionActivity, TableSession, storeSessionData, getStoredSessionData } from '@/lib/session-manager';
import { getTokenFromUrl } from '@/utils/token';
import { supabase } from '@/lib/supabase';

interface SessionContextType {
  session: TableSession | null;
  loading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<TableSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get venueSlug from URL dynamically instead of useParams (since we're at root level now)
  const getVenueSlugFromPath = () => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const match = path.match(/\/d\/([^\/]+)/);
    return match ? match[1] : null;
  };

  const resolveSession = async () => {
    const venueSlug = getVenueSlugFromPath();
    
    // Only resolve for venue paths
    if (!venueSlug) {
      setSession(null);
      setError(null);
      setLoading(false);
      return;
    }
    
    const tableToken = getTokenFromUrl();
    
    if (!tableToken) {
      // Try to recover session from storage
      const recoveredSession = recoverSessionFromStorage(venueSlug);
      if (recoveredSession) {
        console.log('SessionContext: Recovered session from storage');
        setSession(recoveredSession);
        setError(null);
        setLoading(false);
        
        // Update activity for recovered session
        updateSessionActivity(recoveredSession.sessionId);
        return;
      }
      
      // No table token and no recovery - this is a direct venue access without a specific table
      setSession(null);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Use the resolve-session edge function for server validation
      const { data, error: apiError } = await supabase.functions.invoke('resolve-session', {
        body: { token: tableToken }
      });

      if (apiError || !data) {
        console.error('SessionContext: Server validation failed:', apiError);
        
        // Determine error type from response
        let errorType = 'invalid_token';
        if (apiError?.message?.includes('unknown_token')) errorType = 'unknown_token';
        else if (apiError?.message?.includes('expired')) errorType = 'expired_session';
        
        setError(errorType);
        setSession(null);
        return;
      }

      // Verify that the resolved venue matches the URL slug
      if (data.venue_slug !== venueSlug) {
        console.warn('SessionContext: Venue mismatch - token for', data.venue_slug, 'but URL has', venueSlug);
        setError('token_mismatch');
        setSession(null);
        return;
      }

      // Create session object from resolved data
      const resolvedSession = {
        sessionId: data.table_session_id,
        venue: data.venue_slug,
        venueId: data.venue_id,
        table: data.table_label,
        token: data.token
      };

      // Store in sessionStorage for recovery
      storeSessionData(venueSlug, resolvedSession);
      
      setSession(resolvedSession);
      setError(null);
      
      console.log('SessionContext: Session resolved successfully');
      
    } catch (err: any) {
      console.error('SessionContext: Session resolution failed:', err);
      setError(err.message || 'Failed to resolve table session');
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    resolveSession();
    
    // Re-resolve when URL changes (for venue navigation)
    const handleLocationChange = () => {
      resolveSession();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleLocationChange);
      return () => window.removeEventListener('popstate', handleLocationChange);
    }
  }, []); // Run once on mount, then listen for URL changes

  const refreshSession = async () => {
    await resolveSession();
  };

  // Use a ref to track if we're on the client to avoid hydration mismatch
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <SessionContext.Provider value={{
      session,
      loading,
      error,
      refreshSession
    }}>
      {!isClient ? (
        children
      ) : loading && getVenueSlugFromPath() ? (
        <div style={{ padding: 16, textAlign: 'center' }}>Loading table session…</div>
      ) : (
        children
      )}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('useSession used outside a SessionProvider (DEV fallback)');
      return { loading: true, session: null, error: null, refreshSession: async () => {} } as any;
    }
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};