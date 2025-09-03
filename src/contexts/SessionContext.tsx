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
    console.log('🔍 Resolving session for venue:', venueSlug);
    
    // Only resolve for venue paths
    if (!venueSlug) {
      console.log('❌ No venue slug in path');
      setSession(null);
      setError(null);
      setLoading(false);
      return;
    }
    
    const tableToken = getTokenFromUrl();
    console.log('🎫 Table token from URL:', tableToken);
    
    if (!tableToken) {
      // Try to recover session from storage
      const recoveredSession = recoverSessionFromStorage(venueSlug);
      if (recoveredSession) {
        console.log('✅ Recovered session from storage:', recoveredSession);
        setSession(recoveredSession);
        setError(null);
        setLoading(false);
        
        // Update activity for recovered session
        updateSessionActivity(recoveredSession.sessionId);
        return;
      }
      
      console.log('❌ No table token and no recovered session');
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
      console.log('🔄 Calling resolve-session Edge Function with token:', tableToken);
      const { data, error: apiError } = await supabase.functions.invoke('resolve-session', {
        body: { token: tableToken }
      });

      console.log('📦 Edge Function response:', { data, error: apiError });

      if (apiError || !data) {
        console.error('❌ Server validation failed:', apiError);

        // Determine error type from response
        let errorType = 'invalid_token';
        if (apiError?.message?.includes('unknown_token')) {
          errorType = 'unknown_token';
        } else if (apiError?.message?.includes('expired')) {
          errorType = 'expired_session';
        } else if (apiError?.message?.includes('server_error') ||
                   apiError?.message?.includes('Missing required') ||
                   apiError?.message?.includes('Internal server error')) {
          errorType = 'server_error';
          console.error('🚨 Server configuration error detected:', apiError?.message);
        }

        console.log('❌ Setting error:', errorType);
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

      // Provide more specific error messages based on the error type
      let errorMessage = 'Failed to resolve table session';
      if (err.message?.includes('fetch')) {
        errorMessage = 'network_error';
      } else if (err.message?.includes('Missing required environment')) {
        errorMessage = 'server_error';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
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