"use client"

import * as React from "react"
import { ShoppingCart, Plus, Minus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  notes?: string
}

interface CartBarProps {
  items?: CartItem[]
  totalAmount?: number
  isVisible?: boolean
  onCheckout?: () => void
  onUpdateQuantity?: (itemId: string, quantity: number) => void
  onRemoveItem?: (itemId: string) => void
  onToggleExpanded?: (expanded: boolean) => void
  className?: string
}

const sampleItems: CartItem[] = [
  {
    id: "1",
    name: "Truffle Burger",
    price: 1899,
    quantity: 2,
    image: "/api/placeholder/60/60"
  },
  {
    id: "2", 
    name: "Caesar Salad",
    price: 1299,
    quantity: 1,
    image: "/api/placeholder/60/60"
  }
]

export default function CartBar({ 
  items = sampleItems,
  totalAmount,
  isVisible = true,
  onCheckout,
  onUpdateQuantity,
  onRemoveItem,
  onToggleExpanded,
  className 
}: CartBarProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const calculatedTotal = totalAmount || items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price / 100)
  }

  const handleToggleExpanded = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    onToggleExpanded?.(newExpanded)
  }

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemoveItem?.(itemId)
    } else {
      onUpdateQuantity?.(itemId, newQuantity)
    }
  }

  // Don't render if no items or not visible
  if (!isVisible || totalItems === 0) {
    return null
  }

  return (
    <>
      {/* Expanded Cart Items Overlay */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[45]" onClick={handleToggleExpanded} />
      )}

      <div className={cn("cart-bar-container border-t", className)}>
        <div className="container-mobile">
          {/* Expanded Cart Items */}
          {isExpanded && (
            <div className="border-b border-border bg-background/95 backdrop-blur-sticky">
              <div className="py-4 space-y-3 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between px-4">
                  <h3 className="text-sm font-semibold">Your Order</h3>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleToggleExpanded}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {items.map((item) => (
                  <Card
                    key={item.id}
                    variant="flat"
                    padding="sm"
                    className="mx-4 bg-background/80"
                  >
                    <div className="flex items-center space-x-3">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(item.price)} each
                        </p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground italic">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <Badge variant="outline" className="min-w-[2rem] justify-center">
                          {item.quantity}
                        </Badge>
                        
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Cart Summary Bar */}
          <div 
            className="px-4 py-3 flex items-center gap-3"
            style={{
              paddingBottom: "calc(12px + var(--sa-bottom))",
              minHeight: "var(--twyst-cart-h)"
            }}
          >
            {/* Cart Toggle Button */}
            <button
              onClick={handleToggleExpanded}
              className={cn(
                "flex items-center space-x-3 text-left flex-1 min-w-0",
                "hover:opacity-75 transition-opacity tap-target",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
              )}
            >
              <div className="relative flex-shrink-0">
                <ShoppingCart className="h-6 w-6" />
                <Badge 
                  size="sm" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {totalItems}
                </Badge>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tap to {isExpanded ? 'collapse' : 'view items'}
                </p>
              </div>
            </button>

            {/* Total and Checkout */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="text-right">
                <p className="text-lg font-bold">
                  {formatPrice(calculatedTotal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total
                </p>
              </div>
              
              <Button
                variant="primary"
                size="lg"
                onClick={onCheckout}
                className="shadow-glow hover:shadow-glow hover:scale-105 tap-target"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Checkout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}



