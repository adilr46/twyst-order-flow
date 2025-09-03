"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { formatMoney } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'

interface StickyCheckoutBarProps {
  count: number
  total: number
  onCheckout?: () => void
  onClear?: () => void
}

export default function StickyCheckoutBar({ 
  count, 
  total, 
  onCheckout, 
  onClear 
}: StickyCheckoutBarProps) {
  const { toast } = useToast()

  const handleCheckout = () => {
    // Use the passed onCheckout prop if available
    if (onCheckout) {
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
          <div className="rounded-2xl border bg-white/95 backdrop-blur-sm shadow-lg p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>🛒</span>
                  <span>{count} {count === 1 ? 'item' : 'items'}</span>
                  <span className="text-gray-400">|</span>
                  <span className="font-semibold text-gray-900">
                    {formatMoney(Math.round(total * 1.22))}
                  </span>
                </div>
                
                {onClear && (
                  <button
                    onClick={onClear}
                    className="text-xs text-red-500 hover:text-red-700 underline ml-2"
                    aria-label="Clear cart"
                  >
                    Clear
                  </button>
                )}
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
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
