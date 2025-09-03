"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import NavCartButton from '@/components/diner/NavCartButton';
import CategoryTabs from '@/components/diner/CategoryTabs';
import MenuItemCard from '@/components/diner/MenuItemCard';
import StickyCheckoutBar from '@/components/diner/StickyCheckoutBar';
import { MenuItem } from '@/types';
import { useVenue } from '@/hooks/useVenue';
import { getMenuItems } from '@/lib/data-layer';
import { useSession } from '@/contexts/SessionContext';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getTokenFromUrl } from '@/utils/token';
import { toErrorMessage, formatMoney } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { buildTabsFromItems, filterItemsByTab, countPerTab, FIXED_CATEGORY_ORDER, toTitleCase, type FixedCategory } from '@/utils/categoryOrder';
import { buildOrderPayload } from '@/utils/buildOrderPayload';
import { startCheckout } from '@/lib/checkout';
import { devLog } from '@/lib/devLog';

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
  
  const { venue, loading: venueLoading, error: venueError } = useVenue(venueSlug);
  const { session } = useSession();
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // Self-check on mount
  useEffect(() => {
    const runSelfCheck = async () => {
      try {
        const token = getTokenFromUrl();
        if (token) {
          // await twystSelfCheck(); // Not needed for pilot
        }
      } catch (error) {
        console.error('Self-check failed:', error);
      }
    };
    
    runSelfCheck();
  }, [venueSlug]);

  // Fetch menu items
  useEffect(() => {
    const fetchMenu = async () => {
      if (!venue?.id) return;
      
      try {
        setIsLoading(true);
        const items = await getMenuItems(venue.id);
        setMenuItems(items);
      } catch (err) {
        console.error('Failed to fetch menu:', err);
        setError('Failed to load menu items');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, [venue?.id]);

  // State & derived data using new robust utils
  const items = menuItems ?? [];
  const tabs = buildTabsFromItems(items);
  const counts = countPerTab(items);

  // Fallback: if current tab has 0 items but others have >0, switch to the first with items
  useEffect(() => {
    const currentCount = counts[selectedTab] ?? 0;
    if (currentCount > 0) return;
    for (const t of ["Appetizers","Mains","Desserts","Drinks","All"] as FixedCategory[]) {
      if ((counts[t] ?? 0) > 0) { setSelectedTab(t); break; }
    }
  }, [JSON.stringify(counts), selectedTab]);

  // Filter items by selected tab and search
  const filteredItems = useMemo(() => {
    // Start with tab-filtered items
    let items = filterItemsByTab(menuItems, selectedTab);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.dietary && item.dietary.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    return items;
  }, [menuItems, selectedTab, searchQuery]);

  // Group filtered items by category for display
  const groupedItems = useMemo(() => {
    const grouped = filteredItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
    
    return grouped;
  }, [filteredItems]);

  // Cart calculations
  const cartCount = useMemo(() => 
    cart.items.reduce((sum, item) => sum + item.quantity, 0), 
    [cart.items]
  );

  // Get quantity for a specific item
  const getItemQuantity = (itemId: string) => {
    const cartItem = cart.items.find(item => item.id === itemId);
    return cartItem?.quantity || 0;
  };

  // Cart handlers
  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      description: item.description,
      price_cents: item.price_cents,
      category: item.category,
      image: item.image,
      available: item.available,
      dietary: item.dietary,
      quantity: 1,
      specialInstructions: undefined
    });
  };

  const handleIncreaseQuantity = (itemId: string) => {
    const currentQty = getItemQuantity(itemId);
    updateQuantity(itemId, currentQty + 1);
  };

  const handleDecreaseQuantity = (itemId: string) => {
    const currentQty = getItemQuantity(itemId);
    if (currentQty > 1) {
      updateQuantity(itemId, currentQty - 1);
    } else {
      removeFromCart(itemId);
    }
  };
  const handleCheckout = async () => {
    devLog('checkout-click', { cartSize: cart.items.length });
    
    if (cart.items.length === 0) {
      devLog('checkout:step1', 'Cart empty - returning');
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart first!",
        variant: "destructive"
      });
      return;
    }
    
    devLog('checkout:debug', { 
      hasVenue: !!venue, 
      hasSession: !!session,
      venueId: venue?.id,
      sessionId: session?.sessionId 
    });

    if (!venue || !session) {
      devLog('checkout:step2', 'Session/venue validation failed', {
        hasVenue: !!venue,
        hasSession: !!session,
        sessionError: session ? null : 'No session available'
      });

      let errorMessage = "Please refresh the page and try again.";
      if (!venue) {
        errorMessage = "Venue information is not available. Please refresh the page.";
      } else if (!session) {
        errorMessage = "Table session is not available. Please scan the QR code again.";
      }

      toast({
        title: "Session error",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    devLog('checkout:step3', 'Session/venue validation passed');

  




    setIsProcessing(true);

    try {
      // Step 1: Create order via Edge Function FIRST (with venue_id)
      const orderPayload = buildOrderPayload(cart, {
        table_session_id: session.sessionId, // Use the resolved session ID
        venue_id: venue.id,
        tax_rate_bps: 2000, // 20% VAT
        service_fee_bps: 200   // 2% service fee
      });

      devLog('checkout:creating-order', { 
        venueId: venue.id, 
        sessionId: session.sessionId?.slice(0, 8),
        total: orderPayload.total_cents 
      });

      const { data, error } = await supabase.functions.invoke('create-order', {
        body: orderPayload
      });

      if (error) {
        console.error('Order creation failed:', error);
        throw new Error(`Failed to create order: ${error.message}`);
      }

      const orderId = data.order_id || data.orderId;
      if (!orderId) {
        throw new Error('No order ID returned from create-order function');
      }

      devLog('checkout:order-created', { orderId: orderId?.slice(0, 8) });

      // Step 2: Create Stripe checkout session with existing order
      const checkoutCart = cart.items.map(item => ({
        id: item.id,
        name: item.name,
        unit_price_cents: item.price_cents,
        quantity: item.quantity,
        notes: item.specialInstructions || null
      }));

      // Step 3: Close cart drawer but DON'T clear cart yet
      setIsCartOpen(false);

      // Step 4: Create Stripe session with order context - simplified
      await startCheckout(venue.slug, checkoutCart, orderId);

      // Step 5: Clear cart ONLY after successful Stripe redirect
      clearCart();

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

  if (venueLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-sm mx-auto px-4 py-6">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-12 w-full rounded-md" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-md" />
              ))}
            </div>
            <div className="grid gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-9 w-20 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Guard against invalid menu items
  if (!Array.isArray(menuItems)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="p-4 text-sm opacity-70">No menu items yet.</div>
      </div>
    );
  }

  if (venueError || !venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="h-8 w-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Venue Not Found</h2>
            <p className="text-gray-600">
              {venueError ? toErrorMessage(venueError) : `We couldn't find a venue with the slug "${venueSlug}".`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => window.location.href = '/'}>
              Go Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md"
        >
          <Alert>
            <AlertDescription>
              {toErrorMessage(error)}
            </AlertDescription>
          </Alert>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-screen-sm mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-gray-900">
                {toTitleCase(venue.name)}
              </h1>
              {session?.table && (
                <p className="text-sm text-gray-500">
                  Table {session.table}
                </p>
              )}
            </div>
            
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <NavCartButton 
                  count={cartCount} 
                  onOpen={() => setIsCartOpen(true)} 
                />
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="px-4 py-4 border-b">
                  <SheetTitle>Your Order</SheetTitle>
                  {session?.table && (
                    <p className="text-sm text-gray-500">Table {session.table}</p>
                  )}
                </SheetHeader>
                
                {/* Cart Items - Scrollable */}
                <div className="flex-1 overflow-auto px-4 py-4">
                  {cart.items.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Your cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.items.map((item) => (
                        <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{item.name}</h4>
                            <p className="text-sm text-gray-500">
                              {formatMoney(item.price_cents)} × {item.quantity}
                            </p>
                            <p className="text-sm font-medium">
                              {formatMoney(item.price_cents * item.quantity)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <motion.button
                              whileTap={{ scale: 0.92 }}
                              className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-red-600 hover:text-white active:bg-red-700 transition-colors duration-150"
                              onClick={() => handleDecreaseQuantity(item.id)}
                              aria-label={`Decrease quantity of ${item.name}`}
                            >
                              <Minus className="h-3 w-3" />
                            </motion.button>
                            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                            <motion.button
                              whileTap={{ scale: 0.92 }}
                              className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-green-600 hover:text-white active:bg-green-700 transition-colors duration-150"
                              onClick={() => handleIncreaseQuantity(item.id)}
                              aria-label={`Increase quantity of ${item.name}`}
                            >
                              <Plus className="h-3 w-3" />
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Section - Totals and Buttons */}
                {cart.items.length > 0 && (
                  <div className="border-t bg-white px-4 py-4 space-y-4">
                    {/* Subtotal, Service Fee, VAT, Total Breakdown */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>{formatMoney(cart.totalAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Service Fee (2%):</span>
                        <span>{formatMoney(Math.round(cart.totalAmount * 0.02))}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">VAT (20%):</span>
                        <span>{formatMoney(Math.round(cart.totalAmount * 0.20))}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex items-center justify-between text-lg font-semibold">
                          <span>Total:</span>
                          <span>{formatMoney(Math.round(cart.totalAmount * 1.22))}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <motion.button
                        onClick={handleCheckout}
                        disabled={isProcessing}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200 disabled:text-gray-400 transition-all duration-200 rounded-lg font-medium shadow-lg hover:shadow-xl"
                      >
                        {isProcessing ? 'Processing...' : 'Checkout'}
                      </motion.button>
                      
                      <div className="w-full flex justify-center">
                        <button
                          onClick={clearCart}
                          className="text-red-500 text-sm font-medium hover:underline"
                        >
                          Clear Cart
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-sm mx-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        {/* Search Bar */}
        <div className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-2xl border-gray-200"
            />
          </div>
        </div>

        {/* Category Tabs */}
        {tabs.length > 1 && (
          <CategoryTabs
            tabs={tabs}
            active={selectedTab}
            onChange={setSelectedTab}
            counts={counts}
          />
        )}

        {/* Menu Items */}
        {isLoading ? (
          <div className="grid gap-3 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-9 w-20 ml-auto" />
              </div>
            ))}
          </div>
        ) : Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-12">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No items found</h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? 'Try adjusting your search'
                  : 'No menu items available at this time'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {Object.entries(groupedItems).map(([category, items]) => (
              <motion.section
                key={category}
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold mt-6 mb-2">
                  {toTitleCase(category)}
                </h2>
                
                <div className="grid gap-3">
                  {items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      qty={getItemQuantity(item.id)}
                      onAdd={() => handleAddToCart(item)}
                      onInc={() => handleIncreaseQuantity(item.id)}
                      onDec={() => handleDecreaseQuantity(item.id)}
                    />
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        )}
      </main>

      {/* Sticky Checkout Bar */}
      <StickyCheckoutBar
        count={cartCount}
        total={cart.totalAmount}
        onCheckout={handleCheckout}
        onClear={cartCount > 0 ? clearCart : undefined}
      />
    </div>
  );
};

export default DinerMenu;

