// Simplified MVP Database Types
// Core 5 tables only: venues, tables, menu_items, orders, order_items

export interface Venue {
  id: string;
  name: string;
  slug: string;
  currency: string;
  created_at: string;
}

export interface Table {
  id: string;
  venue_id: string;
  label: string;
  token: string;
  created_at: string;
}

export interface MenuItem {
  id: string;
  venue_id: string;
  name: string;
  description?: string;
  price_cents: number;
  category?: string;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  short_code: string;
  venue_id: string;
  table_id: string;
  status: 'created' | 'paid' | 'in_prep' | 'ready' | 'served';
  payment_intent?: string;
  paid_at?: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  qty: number;
  price_cents: number;
  item_description?: string;
  created_at: string;
}

// Cart types
export interface CartItem {
  id: string;
  name: string;
  price_cents: number;
  qty: number;
  notes?: string;
}

export interface CartState {
  items: CartItem[];
  totalAmount: number;
}

// API request/response types
export interface CreateCheckoutRequest {
  venueSlug: string;
  tableToken: string;
  items: CartItem[];
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
}

export interface CreateCheckoutResponse {
  url: string;
  orderId: string;
  shortCode: string;
}

export interface UpdateStatusRequest {
  orderId: string;
  status: Order['status'];
}

export interface TableLookupResponse {
  table: Table;
  venue: Venue;
}

// Webhook event tracking
export interface WebhookEvent {
  id: string;
  type: string;
  processed_at: string;
  created_at: string;
}