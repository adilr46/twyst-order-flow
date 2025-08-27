"use client"

import * as React from "react"
import { ArrowLeft, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import CategoryNav from "./CategoryNav"
import CartBar from "./CartBar"

interface AppShellProps {
  // Header props
  title?: string
  subtitle?: string
  showBackButton?: boolean
  onBack?: () => void
  headerActions?: React.ReactNode
  
  // Category navigation
  showCategoryNav?: boolean
  categories?: Array<{ id: string; label: string; count?: number }>
  activeCategory?: string
  onCategoryChange?: (categoryId: string) => void
  
  // Cart props
  cartItems?: Array<{
    id: string
    name: string
    price: number
    quantity: number
    image?: string
    notes?: string
  }>
  totalAmount?: number
  showCart?: boolean
  onCheckout?: () => void
  onUpdateQuantity?: (itemId: string, quantity: number) => void
  onRemoveItem?: (itemId: string) => void
  
  // Content
  children: React.ReactNode
  className?: string
}

export default function AppShell({
  title = "Menu",
  subtitle,
  showBackButton = false,
  onBack,
  headerActions,
  showCategoryNav = true,
  categories,
  activeCategory,
  onCategoryChange,
  cartItems,
  totalAmount,
  showCart = true,
  onCheckout,
  onUpdateQuantity,
  onRemoveItem,
  children,
  className
}: AppShellProps) {
  return (
    <main className={cn("min-h-app flex flex-col", className)}>
      {/* Sticky Header */}
      <header className="sticky-header bg-background/80 backdrop-blur-sticky border-b">
        <div className="container-mobile h-header flex items-center justify-between px-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onBack}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="flex-1 min-w-0">
              {subtitle && (
                <div className="text-xs text-muted-foreground truncate">
                  {subtitle}
                </div>
              )}
              <div className="text-base font-semibold truncate">
                {title}
              </div>
            </div>
          </div>
          
          {headerActions && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      </header>

      {/* Sticky Category Navigation */}
      {showCategoryNav && (
        <div className="sticky-catnav bg-background/80 backdrop-blur-sticky border-b">
          <div className="container-mobile px-4">
            <CategoryNav
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={onCategoryChange}
            />
          </div>
        </div>
      )}

      {/* Scrollable Content with Safe Bottom Padding */}
      <section className="flex-1 page-safe">
        <div className="container-mobile px-4 py-3">
          {children}
        </div>
      </section>

      {/* Fixed Cart Bar */}
      {showCart && (
        <CartBar
          className="fixed-cart"
          items={cartItems}
          totalAmount={totalAmount}
          onCheckout={onCheckout}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
        />
      )}

      {/* Spacer for iOS safe area */}
      <div className="cart-spacer decoration-layer" />
    </main>
  )
}

// Header-only shell for pages that don't need category nav or cart
export function HeaderShell({
  title = "Twyst",
  subtitle,
  showBackButton = false,
  onBack,
  headerActions,
  children,
  className
}: Pick<AppShellProps, 'title' | 'subtitle' | 'showBackButton' | 'onBack' | 'headerActions' | 'children' | 'className'>) {
  return (
    <main className={cn("min-h-app flex flex-col", className)}>
      {/* Sticky Header */}
      <header className="sticky-header bg-background/80 backdrop-blur-sticky border-b">
        <div className="container-mobile h-header flex items-center justify-between px-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onBack}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="flex-1 min-w-0">
              {subtitle && (
                <div className="text-xs text-muted-foreground truncate">
                  {subtitle}
                </div>
              )}
              <div className="text-base font-semibold truncate">
                {title}
              </div>
            </div>
          </div>
          
          {headerActions && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <section className="flex-1">
        <div className="container-mobile px-4 py-3">
          {children}
        </div>
      </section>
    </main>
  )
}



