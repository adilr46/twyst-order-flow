"use client"

import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useSession } from '@/contexts/SessionContext';
import { useVenue } from '@/hooks/useVenue';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { startCheckout } from '@/lib/checkout';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@/lib/format';
import { devLog } from '@/lib/devLog';
import { buildOrderPayload } from '@/utils/buildOrderPayload';

export default function CartBar() {
  const { cart, clearCart } = useCart();
  const { session } = useSession();
  const { venue } = useVenue();
  const router = useRouter();
  const { toast } = useToast();

  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.totalAmount;

  const handleCheckout = async () => {
    if (!venue || !session) {
      toast({
        title: "Session error",
        description: "Please refresh the page and try again",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use centralized payload builder
      const orderPayload = buildOrderPayload(cart, {
        table_session_id: session.sessionId,
        venue_id: venue.id,
        tax_rate_bps: 2000, // 20% VAT
        service_fee_bps: 200   // 2% service fee
      });

      devLog('checkout:creating-order-cartbar', { venueId: venue.id, total: orderPayload.total_cents });

      // Call the create-order edge function
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: orderPayload
      });

      if (error) {
        console.error('Failed to create order:', error);
        toast({
          title: "Order creation failed",
          description: "Please try again",
          variant: "destructive"
        });
        return;
      }

      const orderId = data.order_id || data.orderId;
      devLog('checkout:order-created-cartbar', { orderId: orderId?.slice(0, 8) });

      // Start Stripe checkout - simplified
      const checkoutCart = cart.items.map(item => ({
        id: item.id,
        name: item.name,
        unit_price_cents: item.price_cents,
        quantity: item.quantity,
        notes: item.specialInstructions || null
      }));
      await startCheckout(venue.slug, checkoutCart, orderId);

    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  if (count === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg"
      >
        <div className="max-w-screen-sm mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>🛒</span>
                <span>{count} {count === 1 ? 'item' : 'items'}</span>
                <span className="text-gray-400">|</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(Math.round(total * 1.22))}
                </span>
              </div>

              <button
                onClick={clearCart}
                className="text-xs text-red-500 hover:text-red-700 underline ml-2"
                aria-label="Clear cart"
              >
                Clear
              </button>
            </div>

            <motion.button
              onClick={handleCheckout}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="h-10 px-4 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              aria-label="Proceed to checkout"
            >
              Checkout
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}