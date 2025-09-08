/**
 * Order status transition utilities for client-side validation and UI
 */

export type OrderStatus = 'created' | 'paid' | 'in_prep' | 'ready' | 'served';

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ['paid'],
  paid: ['in_prep'], 
  in_prep: ['ready'],
  ready: ['served'],
  served: [] // Terminal state
};

/**
 * Check if a status transition is valid
 */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

/**
 * Get all possible next statuses for a given status
 */
export function getValidNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
  return VALID_TRANSITIONS[currentStatus];
}

/**
 * Check if a status is terminal (no further transitions possible)
 */
export function isTerminalStatus(status: OrderStatus): boolean {
  return VALID_TRANSITIONS[status].length === 0;
}

/**
 * Get user-friendly status descriptions
 */
export function getStatusDescription(status: OrderStatus): string {
  switch (status) {
    case 'created':
      return 'Order has been created and is awaiting payment';
    case 'paid':
      return 'Payment confirmed! Order sent to kitchen';
    case 'in_prep':
      return 'Your order is being prepared';
    case 'ready':
      return 'Order is ready for pickup/delivery';
    case 'served':
      return 'Order has been served. Enjoy!';
    default:
      return 'Unknown status';
  }
}

/**
 * Get status color for UI components
 */
export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'created':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'paid':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'in_prep':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'ready':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'served':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Get estimated time for each status (in minutes)
 */
export function getEstimatedTime(status: OrderStatus): number | null {
  switch (status) {
    case 'created':
      return 1; // Payment should be quick
    case 'paid':
      return 15; // Prep time
    case 'in_prep':
      return 5; // Final prep
    case 'ready':
      return null; // Waiting for pickup
    default:
      return null;
  }
}