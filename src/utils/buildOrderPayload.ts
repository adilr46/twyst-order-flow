import { CartItem, CartState } from '@/types';
import { calculateTotal, isValidPrice } from './price';

export interface OrderItem {
  item_id: string;
  qty: number;
  unit_price_cents: number;
  notes: string | null;
  options_json: any[];
}

export interface OrderPayload {
  venue_id: string;
  session_id: string;
  items: OrderItem[];
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  tax_rate_bps: number;
  service_fee_bps: number;
}

export interface OrderContext {
  table_session_id: string;
  venue_id: string;
  tax_rate_bps?: number;
  service_fee_bps?: number;
}

/**
 * Validates cart items before building order payload
 */
export function validateCartForOrder(cart: CartState): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!cart.items || cart.items.length === 0) {
    errors.push('Cart is empty');
    return { isValid: false, errors };
  }

  cart.items.forEach((item, index) => {
    if (!item.id) {
      errors.push(`Item ${index + 1}: Missing item ID`);
    }

    if (!item.name) {
      errors.push(`Item ${index + 1}: Missing item name`);
    }

    if (!isValidPrice(item.price_cents)) {
      errors.push(`Item ${index + 1} (${item.name}): Invalid price (${item.price_cents})`);
    }

    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index + 1} (${item.name}): Invalid quantity (${item.quantity})`);
    }

    // Check for reasonable quantity limits
    if (item.quantity > 99) {
      errors.push(`Item ${index + 1} (${item.name}): Quantity too high (${item.quantity})`);
    }
  });

  return { isValid: errors.length === 0, errors };
}

/**
 * Builds a normalized order payload from cart and context
 * All prices are validated and normalized to cents
 */
export function buildOrderPayload(cart: CartState, context: OrderContext): OrderPayload {
  // Validate inputs
  if (!context.table_session_id) {
    throw new Error('table_session_id is required');
  }

  if (!context.venue_id) {
    throw new Error('venue_id is required');
  }

  const validation = validateCartForOrder(cart);
  if (!validation.isValid) {
    throw new Error(`Invalid cart: ${validation.errors.join(', ')}`);
  }

  // Convert cart items to order items format
  const orderItems: OrderItem[] = cart.items.map(cartItem => ({
    item_id: cartItem.id,
    qty: cartItem.quantity,
    unit_price_cents: cartItem.price_cents,
    notes: cartItem.specialInstructions || null,
    options_json: [] // Reserved for future menu customizations
  }));

  // Calculate totals using centralized calculation
  const subtotalItems = orderItems.map(item => ({
    price_cents: item.unit_price_cents,
    quantity: item.qty
  }));
  
  const subtotal_cents = calculateTotal(subtotalItems);

  // Apply tax rate (default to 20% VAT if not specified)
  const tax_rate_bps = context.tax_rate_bps || 2000; // 20% in basis points
  const tax_cents = Math.round((subtotal_cents * tax_rate_bps) / 10000);

  // Apply service fee (default to 0% if not specified)
  const service_fee_bps = context.service_fee_bps || 0;
  const service_fee_cents = Math.round((subtotal_cents * service_fee_bps) / 10000);

  const total_cents = subtotal_cents + tax_cents + service_fee_cents;

  // Validate final totals
  if (total_cents !== cart.totalAmount) {
    console.warn('Cart total mismatch:', {
      calculated: total_cents,
      cart: cart.totalAmount,
      difference: total_cents - cart.totalAmount
    });
  }

  return {
    venue_id: context.venue_id,
    session_id: context.table_session_id,
    items: orderItems,
    subtotal_cents,
    tax_cents,
    total_cents,
    tax_rate_bps,
    service_fee_bps
  };
}

/**
 * Validates that all items in the order payload have valid prices and quantities
 */
export function validateOrderPayload(payload: OrderPayload): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!payload.venue_id) {
    errors.push('venue_id is required');
  }

  if (!payload.session_id) {
    errors.push('session_id is required');
  }

  if (!payload.items || payload.items.length === 0) {
    errors.push('items array is required and must not be empty');
  }

  payload.items?.forEach((item, index) => {
    if (!item.item_id) {
      errors.push(`Item ${index + 1}: item_id is required`);
    }

    if (!item.qty || item.qty <= 0) {
      errors.push(`Item ${index + 1}: qty must be greater than 0`);
    }

    if (!isValidPrice(item.unit_price_cents)) {
      errors.push(`Item ${index + 1}: invalid unit_price_cents (${item.unit_price_cents})`);
    }
  });

  // Validate totals are positive integers
  if (!isValidPrice(payload.subtotal_cents)) {
    errors.push(`invalid subtotal_cents (${payload.subtotal_cents})`);
  }

  if (!isValidPrice(payload.tax_cents)) {
    errors.push(`invalid tax_cents (${payload.tax_cents})`);
  }

  if (!isValidPrice(payload.total_cents)) {
    errors.push(`invalid total_cents (${payload.total_cents})`);
  }

  // Validate tax rate is reasonable (0-50%)
  if (payload.tax_rate_bps < 0 || payload.tax_rate_bps > 5000) {
    errors.push(`tax_rate_bps must be between 0 and 5000 (${payload.tax_rate_bps})`);
  }

  // Validate service fee is reasonable (0-25%)  
  if (payload.service_fee_bps < 0 || payload.service_fee_bps > 2500) {
    errors.push(`service_fee_bps must be between 0 and 2500 (${payload.service_fee_bps})`);
  }

  return { isValid: errors.length === 0, errors };
}