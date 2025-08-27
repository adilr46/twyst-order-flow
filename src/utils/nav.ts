import { addTokenToUrl } from './token';

/**
 * Creates a link with token preserved for navigation
 */
export function linkWithToken(path: string, token: string | null): string {
  if (!token) {
    return path;
  }
  
  try {
    return addTokenToUrl(path, token);
  } catch {
    // If token is invalid, return path without token
    return path;
  }
}

/**
 * Navigate with token preserved
 */
export function navigateWithToken(navigate: (path: string) => void, path: string, token: string | null): void {
  const finalPath = linkWithToken(path, token);
  navigate(finalPath);
}