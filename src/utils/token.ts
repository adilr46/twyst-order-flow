export const TOKEN_QUERY_KEY = 't';
// Allow both 32-char hex tokens, demo tokens, and custom tokens
export const TOKEN_REGEX = /^(?:[a-f0-9]{32}|demo[0-9]{3}|[a-z0-9\-_]+)$/i;

/**
 * Validates a token format (32-char hex, case-insensitive)
 */
export function validateToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  return TOKEN_REGEX.test(token);
}

/**
 * Extracts table token from URL parameters
 */
export function getTokenFromUrl(url?: URL): string | null {
  const urlToUse = url || (typeof window !== 'undefined' ? new URL(window.location.href) : null);
  console.log('🔍 Getting token from URL:', urlToUse?.toString());
  
  if (!urlToUse) {
    console.log('❌ No URL available');
    return null;
  }
  
  const token = urlToUse.searchParams.get(TOKEN_QUERY_KEY);
  console.log('🎫 Found token:', token);
  
  if (!token) {
    console.log('❌ No token in URL');
    return null;
  }
  
  if (!validateToken(token)) {
    console.log('❌ Invalid token format:', token);
    return null;
  }
  
  console.log('✅ Valid token found:', token);
  return token;
}

/**
 * Adds token to URL path correctly (append ?t= or &t=)
 */
export function addTokenToUrl(path: string, token: string): string {
  if (!validateToken(token)) {
    throw new Error('Invalid token format');
  }
  
  // Guard against SSR
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const url = new URL(path, origin);
  url.searchParams.set(TOKEN_QUERY_KEY, token);
  return url.pathname + url.search;
}

/**
 * Builds a deep link URL with token
 */
export function buildDeepLink(venueSlug: string, token: string, origin?: string): string {
  const baseUrl = origin || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  return `${baseUrl}/d/${venueSlug}?${TOKEN_QUERY_KEY}=${token}`;
}

/**
 * Builds a checkout URL with token preserved
 */
export function buildCheckoutUrl(venueSlug: string, token: string, origin?: string): string {
  const baseUrl = origin || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  return `${baseUrl}/d/${venueSlug}/order?${TOKEN_QUERY_KEY}=${token}`;
}