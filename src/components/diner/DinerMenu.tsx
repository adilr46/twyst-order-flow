"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CartBar from '@/components/diner/CartBar';
import NavCartButton from '@/components/diner/NavCartButton';
import CategoryTabs from '@/components/diner/CategoryTabs';
import MenuItemCard from '@/components/diner/MenuItemCard';
import StickyCheckoutBar from '@/components/diner/StickyCheckoutBar';
import CheckoutSpinner from '@/components/ui/CheckoutSpinner';
import { MenuItem, Table, Venue } from '@/types/database';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { getTokenFromUrl } from '@/utils/token';
import { formatMoney } from '@/lib/format';
import { formatTableLabel } from '@/lib/tableLabel';
import { supabase } from '@/lib/supabase';
import { buildTabsFromItems, filterItemsByTab, countPerTab, type FixedCategory } from '@/utils/categoryOrder';

interface DinerMenuProps {
  venueSlug: string;
}

const DinerMenu: React.FC<DinerMenuProps> = ({ venueSlug }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<FixedCategory>("All");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showUnderline, setShowUnderline] = useState(false);
  const [table, setTable] = useState<Table | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Optimized menu initialization with progressive loading
  useEffect(() => {
    const initializeMenu = async () => {
      try {
        const token = getTokenFromUrl();
        if (!token) {
          setError('No table token found');
          return;
        }

        // Start loading immediately
        setIsLoading(true);

        // Single API call to get venue, table, and menu data
        const response = await fetch(`/api/menu/init?venueSlug=${venueSlug}&tableToken=${token}`, {
          // Add cache headers for faster subsequent loads
          headers: {
            'Cache-Control': 'max-age=300', // 5 minutes
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load menu');
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        
        // Set venue and table first (for immediate display)
        setVenue(data.venue);
        setTable(data.table);
        
        // Flatten the menu items from categories
        const allItems = Object.values(data.menu).flat() as MenuItem[];
        
        // Set all items at once to avoid duplicate key issues
        setMenuItems(allItems);
        setIsLoading(false);

      } catch (err) {
        console.error('Failed to initialize menu:', err);
        setError('Failed to initialize menu');
        setIsLoading(false);
      }
    };

    initializeMenu();
  }, [venueSlug]);

  // State & derived data using new robust utils
  const items = useMemo(() => menuItems ?? [], [menuItems]);
  const tabs = useMemo(() => buildTabsFromItems(items), [items]);
  const counts = useMemo(() => countPerTab(items), [items]);

  // Fallback: if current tab has 0 items but others have >0, switch to the first with items
  useEffect(() => {
    const currentCount = counts[selectedTab] ?? 0;
    if (currentCount > 0) return;
    for (const t of ["Appetizers","Mains","Desserts","Drinks","All"] as FixedCategory[]) {
      if ((counts[t] ?? 0) > 0) { setSelectedTab(t); break; }
    }
  }, [counts, selectedTab]);

  // Filter items by selected tab and search
  const filteredItems = useMemo(() => {
    let filtered = filterItemsByTab(items, selectedTab);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [items, selectedTab, searchQuery]);

  const handleCheckout = async () => {
    if (!table || !venue || cart.items.length === 0) {
      toast({
        title: "Cannot checkout",
        description: "Please ensure you have items in your cart and are at a valid table.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Calculate totals
              const subtotal_cents = cart.items.reduce((sum, item) => sum + (item.price_cents * item.qty), 0);
      const tax_cents = Math.round(subtotal_cents * 0.20); // 20% VAT
      const total_cents = subtotal_cents + tax_cents;

      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueSlug: venue.slug,
          tableToken: table.token,
          items: cart.items.map(item => ({
            id: item.id,
            name: item.name,
            price_cents: item.price_cents,
                         qty: item.qty,
          })),
          subtotal_cents,
          tax_cents,
          total_cents,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = url;

    } catch (error: any) {
      console.error('Checkout failed:', error);
      toast({
        title: "Checkout failed",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-4">
          {/* Show venue/table info immediately if available */}
          {venue && table && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{venue.name}</h1>
              <p className="text-gray-600">Table {formatTableLabel(table.label)}</p>
            </div>
          )}
          
          {/* Lightweight skeleton for menu items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={`skeleton-${i}`} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!table || !venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>Table or venue not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto p-4">
          {/* Restaurant Name & Table */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{venue.name}</h1>
              <span className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-[#F2F4F7] rounded-full flex items-center justify-center">
                {formatTableLabel(table.label)}
              </span>
            </div>
            <div className="shadow-md">
              <NavCartButton 
                count={cart.items.length} 
                onOpen={() => setIsCartOpen(true)} 
              />
            </div>
          </div>
          
          {/* Compact Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-2 text-sm border-[#E5E7EB] rounded-[10px] shadow-sm placeholder:text-[#9CA3AF]"
              style={{ boxShadow: '0px 1px 2px rgba(0,0,0,0.05)' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 w-4 h-4 flex items-center justify-center"
              >
                ×
              </button>
            )}
          </div>
        </div>
        {/* Thin divider line below header */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        {/* Extra spacing below header */}
        <div className="h-2"></div>
      </div>

      {/* Category Navigation - Light Background */}
      <div className="bg-[#F9FAFB]">
        <div className="max-w-4xl mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 py-6 gap-3">
            {tabs.map((tab) => (
              <motion.button
                key={`tab-${tab}`}
                onClick={() => {
                  setSelectedTab(tab);
                  setShowUnderline(true);
                  setTimeout(() => setShowUnderline(false), 500);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`
                  flex-shrink-0 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300
                  snap-start relative
                  ${selectedTab === tab 
                    ? 'bg-[#1e3a8a] text-white font-bold scale-105' 
                    : 'text-[#4B5563] font-medium hover:text-[#1e40af] hover:bg-[#1e3a8a]/5'
                  }
                `}
              >
                {tab}
                {counts && counts[tab] > 0 && (
                  <span className={`ml-2 text-xs ${selectedTab === tab ? 'opacity-90' : 'opacity-60'}`}>
                    ({counts[tab]})
                  </span>
                )}
                {/* Active tab underline indicator */}
                {selectedTab === tab && showUnderline && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "80%" }}
                    exit={{ width: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gray-400 rounded-full"
                  />
                )}
                {/* Custom shadow for active pill */}
                {selectedTab === tab && (
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{ boxShadow: '0px 2px 4px rgba(0,0,0,0.08)' }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>
        {/* Thin divider line below category bar */}
        <div className="h-px bg-[#E5E7EB]"></div>
        {/* Extra spacing below category bar */}
        <div className="h-2"></div>
      </div>

      {/* Menu Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4">
        {/* Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, index) => (
              <div key={`loading-skeleton-${index}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-10 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))
          ) : (
            filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              qty={cart.items.find(cartItem => cartItem.id === item.id)?.qty || 0}
              venueSlug={venueSlug}
              onAdd={() => addToCart({
                id: item.id,
                name: item.name,
                description: item.description || '',
                price_cents: item.price_cents,
                category: item.category || '',
                available: item.is_active,
                qty: 1,
                specialInstructions: undefined
              })}
              onInc={() => {
                const cartItem = cart.items.find(cartItem => cartItem.id === item.id);
                if (cartItem) {
                  updateQuantity(item.id, cartItem.qty + 1);
                }
              }}
              onDec={() => {
                const cartItem = cart.items.find(cartItem => cartItem.id === item.id);
                if (cartItem && cartItem.qty > 1) {
                  updateQuantity(item.id, cartItem.qty - 1);
                } else if (cartItem) {
                  removeFromCart(item.id);
                }
              }}
            />
            ))
          )}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No items found matching your search.</p>
          </div>
        )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartBar
        open={isCartOpen}
        onOpenChange={setIsCartOpen}
        onCheckout={handleCheckout}
        isProcessing={isProcessing}
      />

      {/* Sticky Checkout Bar */}
      <StickyCheckoutBar 
        count={cart.items.length}
        total={cart.totalAmount}
        onCheckout={handleCheckout}
        onClear={cart.items.length > 0 ? clearCart : undefined}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Checkout Processing Spinner */}
      {isProcessing && <CheckoutSpinner />}
    </div>
  );
};

export default DinerMenu;
