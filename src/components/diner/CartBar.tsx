"use client"

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Minus, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/CartContext'
import { formatMoney } from '@/lib/format'

interface CartBarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCheckout: () => void
  isProcessing?: boolean
}

export default function CartBar({ open, onOpenChange, onCheckout, isProcessing = false }: CartBarProps) {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart()
  const firstFocusableRef = useRef<HTMLButtonElement>(null)

  // Focus first focusable element when sidebar opens
  useEffect(() => {
    if (open && firstFocusableRef.current) {
      firstFocusableRef.current.focus()
    }
  }, [open])

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [open, onOpenChange])

  const handleCheckout = () => {
    onCheckout()
    onOpenChange(false)
  }

  const handleClearCart = () => {
    clearCart()
  }

  const subtotal = cart.items.reduce((sum, item) => sum + (item.price_cents * item.qty), 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] bg-gray-50 p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-gray-200">
          <SheetTitle className="text-left text-xl font-bold text-gray-900">
            Your Basket
          </SheetTitle>
        </SheetHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-gray-500 text-lg">Your cart is empty</p>
              <p className="text-gray-400 text-sm mt-2">Add some items to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
                >
                  {/* Item Info */}
                  <div className="flex-1 min-w-0 mr-4">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatMoney(item.price_cents)}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      ref={index === 0 ? firstFocusableRef : undefined}
                      onClick={() => updateQuantity(item.id, item.qty - 1)}
                      disabled={item.qty <= 1}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="h-10 w-10 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      <Minus className="h-4 w-4" />
                    </motion.button>
                    
                    <span className="w-10 text-center font-bold bg-gray-100 rounded-xl h-10 flex items-center justify-center text-base border border-gray-200">
                      {item.qty}
                    </span>
                    
                    <motion.button
                      onClick={() => updateQuantity(item.id, item.qty + 1)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="h-10 w-10 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </motion.button>
                  </div>

                  {/* Line Total & Delete */}
                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <span className="font-semibold text-gray-900">
                      {formatMoney(item.price_cents * item.qty)}
                    </span>
                    <motion.button
                      onClick={() => removeFromCart(item.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 text-red-600 hover:bg-red-100 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Order Summary & Actions */}
        {cart.items.length > 0 && (
          <div className="border-t border-gray-100 bg-white p-6 space-y-4">
            {/* Order Summary */}
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Subtotal:</span>
              <span className="text-xl font-bold text-gray-900">
                {formatMoney(subtotal)}
              </span>
            </div>
            <p className="text-xs text-gray-500 text-center">
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full h-12 text-base font-bold shadow-lg hover:shadow-xl bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl transition-all duration-200"
                aria-label="Proceed to checkout"
              >
                {isProcessing ? 'Processing...' : 'Checkout'}
              </Button>

              {/* Clear Cart Button */}
              <Button
                onClick={handleClearCart}
                variant="outline"
                className="w-full h-11 bg-white text-red-600 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-red-700 transition-all duration-200 rounded-xl font-semibold shadow-sm hover:shadow-md underline"
                aria-label="Clear all items from cart"
              >
                Clear Cart
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}