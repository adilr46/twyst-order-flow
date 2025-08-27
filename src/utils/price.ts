/**
 * Centralized price utilities for consistent handling
 * All internal storage uses cents (integers), display shows £X.XX format
 */

/**
 * Convert pounds to cents (£1.50 → 150)
 */
export function poundsToCents(pounds: number): number {
  return Math.round(pounds * 100);
}

/**
 * Convert cents to pounds (150 → 1.50)
 */
export function centsToPounds(cents: number): number {
  return cents / 100;
}

/**
 * Format cents as currency string (150 → "£1.50")
 */
export function formatPrice(cents: number): string {
  const pounds = centsToPounds(cents);
  return `£${pounds.toFixed(2)}`;
}

/**
 * Format cents as currency string without symbol (150 → "1.50")
 */
export function formatPriceValue(cents: number): string {
  const pounds = centsToPounds(cents);
  return pounds.toFixed(2);
}

/**
 * Validate that a price in cents is valid (positive integer)
 */
export function isValidPrice(cents: number): boolean {
  return Number.isInteger(cents) && cents >= 0;
}

/**
 * Calculate total from array of items with price_cents and quantity
 */
export function calculateTotal(items: Array<{ price_cents: number; quantity: number }>): number {
  return items.reduce((total, item) => {
    if (!isValidPrice(item.price_cents)) {
      console.warn('Invalid price detected:', item.price_cents);
      return total;
    }
    return total + (item.price_cents * item.quantity);
  }, 0);
}

/**
 * Convert legacy price format to cents if needed
 * Handles both cents (integers) and pounds (decimals) for migration
 */
export function normalizePrice(price: number): number {
  // If it's already an integer > 100, assume it's cents
  if (Number.isInteger(price) && price >= 100) {
    return price;
  }
  
  // If it's a decimal or small integer, assume it's pounds
  return poundsToCents(price);
}