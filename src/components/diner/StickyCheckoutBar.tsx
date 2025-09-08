"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'

interface StickyCheckoutBarProps {
  count: number
  total: number
  onCheckout?: () => void
  onClear?: () => void
  onOpenCart?: () => void
}

export default function StickyCheckoutBar({ 
  count, 
  total, 
  onCheckout, 
  onClear,
  onOpenCart 
}: StickyCheckoutBarProps) {
  const { toast } = useToast()

  const handleCartClick = () => {
    // Open cart sidebar if available, otherwise fall back to direct checkout
    if (onOpenCart) {
      onOpenCart();
    } else if (onCheckout) {
      onCheckout();
    } else {
      toast({
        title: "Checkout unavailable",
        description: "Please refresh the page and try again.",
        variant: "destructive"
      });
    }
  }

  if (count === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 72, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 24
        }}
        className="fixed inset-x-0 bottom-0 z-40"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)'
        }}
      >
        <div className="mx-auto max-w-screen-sm px-4">
          <div className="rounded-t-3xl bg-white shadow-xl border-t border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-heading text-xl font-bold">
                    {formatMoney(total)}
                  </span>
                </div>

                {onClear && (
                  <motion.button
                    onClick={onClear}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="self-start bg-white text-red-600 border-2 border-red-200 hover:bg-red-50 hover:border-red-300 font-medium rounded-full px-3 py-1.5 text-xs transition-all duration-300 ease-in-out shadow-sm hover:shadow-md"
                    aria-label="Clear cart"
                  >
                    Clear Cart
                  </motion.button>
                )}
              </div>

              <motion.button
                onClick={handleCartClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary h-12 px-6 rounded-full flex items-center gap-3 shadow-lg hover:shadow-xl text-base font-semibold"
                aria-label={onOpenCart ? "Open cart" : "Proceed to checkout"}
              >
                <ShoppingCart className="w-6 h-6 text-white" />
                <span>{onOpenCart ? "View Cart" : "Checkout"}</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
