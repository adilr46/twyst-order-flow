"use client"

import { useState, useMemo } from 'react'
import { useCart } from '@/contexts/CartContext'
import { formatMoney } from '@/lib/format'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { X, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'
import { useSession } from '@/contexts/SessionContext'
import { useVenue } from '@/hooks/useVenue'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { buildOrderPayload } from '@/utils/buildOrderPayload'
import { startCheckout } from '@/lib/checkout'
import { devLog } from '@/lib/devLog'

export default function CartButton() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart()
  const { session } = useSession()
  const { venue } = useVenue(session?.venue || '')
  const { toast } = useToast()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const count = useMemo(() => 
    cart.items.reduce((n, i) => n + i.quantity, 0), 
    [cart.items]
  )

  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart first!",
        variant: "destructive"
      })
      return
    }

    if (!venue) {
      toast({
        title: "Venue not found",
        description: "Unable to process order. Please try again.",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)

    try {
      // ✅ Fix Issue #19-21: Proper order creation flow matching other components
      const orderPayload = buildOrderPayload(cart, {
        table_session_id: session?.sessionId || '',
        venue_id: venue.id,
        tax_rate_bps: 2000, // 20% VAT
        service_fee_bps: 200   // 2% service fee
      });

      devLog('checkout:creating-order-cart', { venueId: venue.id, total: orderPayload.total_cents });

      const { data, error } = await supabase.functions.invoke('create-order', {
        body: orderPayload
      });

      if (error) throw error;

      const orderId = data.order_id || data.orderId;
      devLog('checkout:order-created-cart', { orderId: orderId?.slice(0, 8) });

      // Prepare cart for checkout (snapshot before clearing)
      const checkoutCart = cart.items.map(item => ({
        id: item.id,
        name: item.name,
        unit_price_cents: item.price_cents,
        quantity: item.quantity,
        notes: item.specialInstructions || null
      }));

      // Close the cart drawer
      setOpen(false)

      // Create Stripe session with order context - simplified
      await startCheckout(venue.slug, checkoutCart, orderId);

      // Clear cart ONLY after successful Stripe redirect
      clearCart()

    } catch (error: any) {
      console.error('Checkout failed:', error)
      toast({
        title: "Checkout failed",
        description: error.message || "Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Don't render if no items
  if (count === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="rounded-2xl shadow-lg px-4 h-12 flex items-center gap-2 bg-primary hover:bg-primary/90"
            aria-label={`Open cart with ${count} items`}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="font-medium">Cart</span>
            <Badge variant="secondary" className="ml-2 rounded-xl">
              {count}
            </Badge>
            <span className="ml-2 font-semibold">
              {formatMoney(cart.totalAmount)}
            </span>
          </Button>
        </SheetTrigger>

        <SheetContent 
          side="right" 
          className="w-full sm:max-w-md p-0 flex flex-col rounded-l-2xl"
        >
          <SheetHeader className="px-4 py-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">Your Order</SheetTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setOpen(false)} 
                aria-label="Close cart"
                className="rounded-xl"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {session?.table && (
              <div className="text-sm text-muted-foreground">
                Table {session.table}
              </div>
            )}
          </SheetHeader>

          {/* Items */}
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {cart.items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              cart.items.map((item) => (
                <div 
                  key={item.id} 
                  className="rounded-2xl border p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.specialInstructions && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-medium">
                          {formatMoney(item.price_cents)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          × {item.quantity}
                        </span>
                        <span className="text-sm font-semibold ml-auto">
                          {formatMoney(item.price_cents * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                        className="h-8 w-8 rounded-lg"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="h-8 w-8 rounded-lg"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => removeFromCart(item.id)}
                      aria-label="Remove item"
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary / Checkout pinned bottom */}
          {cart.items.length > 0 && (
            <div className="border-t p-4 space-y-4 bg-background">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatMoney(cart.totalAmount)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(cart.totalAmount)}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1 h-11 rounded-xl" 
                  onClick={handleCheckout}
                  disabled={isProcessing || cart.items.length === 0}
                >
                  {isProcessing ? 'Processing...' : 'Checkout'}
                </Button>
                <Button 
                  variant="outline" 
                  className="h-11 rounded-xl px-4" 
                  onClick={clearCart}
                  disabled={cart.items.length === 0}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

