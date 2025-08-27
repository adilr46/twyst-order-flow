/**
 * Utility functions for formatting data for display
 */

/**
 * Converts an error of unknown type to a displayable string message
 */
export const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  return String(error);
};

/**
 * Formats price in cents to currency string
 */
export const formatMoney = (priceCents: number, currency = 'GBP'): string => {
  return new Intl.NumberFormat('en-GB', { 
    style: 'currency', 
    currency 
  }).format(priceCents / 100);
};

