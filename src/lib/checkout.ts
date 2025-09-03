import { devLog } from '@/lib/devLog';
import { CheckoutCartItem, CheckoutRequest, CheckoutResponse } from '@/types';

// Global lock to prevent double-click issues
declare global {
  interface Window {
    __TWYST_CHECKOUT_LOCK__?: boolean;
  }
}

export async function startCheckout(venueSlug: string, cart?: CheckoutCartItem[], orderId?: string): Promise<void> {
  // Double-click protection
  if (typeof window !== 'undefined' && window.__TWYST_CHECKOUT_LOCK__) {
    devLog('checkout:blocked', 'Double-click protection active');
    return;
  }

  if (typeof window !== 'undefined') {
    window.__TWYST_CHECKOUT_LOCK__ = true;
    setTimeout(() => {
      window.__TWYST_CHECKOUT_LOCK__ = false;
    }, 2000);
  }

  try {
    // If no cart provided, get it from context (this will be handled by the calling component)
    if (!cart || cart.length === 0) {
      throw new Error('Cart is empty');
    }

    devLog('checkout:start', { venueSlug, cartSize: cart.length });

    const request: CheckoutRequest = {
      venueSlug,
      orderId: orderId || ''
    };

    const response = await fetch('/api/checkout/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      devLog('checkout:api-error', { status: response.status, error: error.error, requestId: error.requestId });
      
      // Include requestId in error for debugging
      const errorMessage = error.requestId 
        ? `${error.error} (Tell dev: reqId ${error.requestId})`
        : error.error || 'Failed to create checkout session';
      
      throw new Error(errorMessage);
    }

    const data: CheckoutResponse = await response.json();
    
    if (!data.url) {
      throw new Error('No checkout URL returned');
    }

    devLog('checkout:redirect', { hasUrl: !!data.url });
    
    // Hard redirect to Stripe checkout
    window.location.href = data.url;

  } catch (error) {
    devLog('checkout:error', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  } finally {
    if (typeof window !== 'undefined') {
      window.__TWYST_CHECKOUT_LOCK__ = false;
    }
  }
}
