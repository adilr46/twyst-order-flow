// Twyst Core Types

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number; // Changed to cents for internal storage
  category: string;
  image?: string | null;
  available: boolean | null;
  dietary?: string[]; // "vegetarian", "vegan", "gluten-free", etc.
}

export interface CartItem extends MenuItem {
  quantity: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  venueSlug: string;
  tableNumber?: string;
  customerName?: string;
  items: CartItem[];
  totalAmount: number; // Keep in cents for internal consistency
  status: OrderStatus;
  timestamp: Date;
  estimatedTime?: number; // minutes
  notes?: string;
}

export type OrderStatus = "created" | "paid" | "accepted" | "in_prep" | "served" | "cancelled";

export interface Venue {
  slug: string;
  name: string;
  description: string;
  logo?: string;
  categories: string[];
  menu: MenuItem[];
}

export interface CartState {
  items: CartItem[];
  totalAmount: number; // Keep in cents for internal consistency
  isOpen: boolean;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

// Simplified checkout types
export interface CheckoutRequest {
  venueSlug: string;
  orderId: string;
}

export interface CheckoutResponse {
  url: string;
}

export interface CheckoutCartItem {
  id: string;
  name: string;
  unit_price_cents: number;
  quantity: number;
  notes?: string | null;
}