// Simple database types for pilot - no complex generated types
export type Database = any; // Simplified for pilot

export interface Venue {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  stripe_account_id?: string;
  created_at: string;
  // NO updated_at - removed as redundant
}

export interface Order {
  id: string;
  venue_id: string;
  session_id?: string;
  status: string;
  payment_status: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  payment_provider: string;
  provider_session_id?: string;
  provider_payment_id?: string;
  created_at: string;
  // NO updated_at - removed as redundant
}

export interface Item {
  id: string;
  venue_id: string;
  name: string;
  description?: string;
  price_cents: number;
  category: string;
  is_active: boolean;
  created_at: string;
  // NO updated_at - removed as redundant
}