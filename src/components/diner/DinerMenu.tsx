"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';

import { motion } from 'framer-motion';
import { Search, Filter, MapPin, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import AppShell from '@/components/diner/AppShell';
import { MenuItem } from '@/types';
import { useVenue } from '@/hooks/useVenue';
import { getMenuItems } from '@/lib/data-layer';
import { useSession } from '@/contexts/SessionContext';
import { getTokenFromUrl } from '@/utils/token';
import { twystSelfCheck } from '@/lib/session-manager';
import { toErrorMessage } from '@/lib/format';

interface DinerMenuProps {
  venueSlug: string;
}

const DinerMenu: React.FC<DinerMenuProps> = ({ venueSlug }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [cart, setCart] = useState<Array<{
    id: string;
    name: string;
    price_cents: number;
    quantity: number;
    notes?: string;
  }>>([]);
  
  const { venue, loading: venueLoading, error: venueError } = useVenue(venueSlug);
  const { session } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);

  // Self-check on mount
  useEffect(() => {
    const runSelfCheck = async () => {
      try {
        const token = getTokenFromUrl();
        if (token) {
          await twystSelfCheck();
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

  // Filter and search logic
  const filteredItems = useMemo(() => {
    let items = menuItems;

    // Filter by category
    if (filterCategory) {
      items = items.filter(item => item.category === filterCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.dietary && item.dietary.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    return items;
  }, [menuItems, filterCategory, searchQuery]);

  // Group items by category
  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [filteredItems]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(menuItems.map(item => item.category))];
    return cats.sort();
  }, [menuItems]);

  const addToCart = (item: MenuItem, quantity: number, notes?: string) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex]!.quantity += quantity;
        if (notes !== undefined) updated[existingIndex]!.notes = notes;
        return updated;
      }
      
      return [...prev, {
        id: item.id,
        name: item.name,
        price_cents: item.price_cents,
        quantity,
        ...(notes !== undefined && { notes })
      }];
    });
  };

  if (venueLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-4" />
                <Skeleton className="h-8 w-20" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (venueError || !venue) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            {venueError ? toErrorMessage(venueError) : 'Venue not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>{toErrorMessage(error)}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <AppShell
      title={venue.name}
      showCategoryNav={true}
      categories={categories.map(cat => ({ id: cat, label: cat }))}
      activeCategory={activeCategory || ''}
      onCategoryChange={setActiveCategory}
      cartItems={cart.map(item => ({
        ...item,
        price: item.price_cents
      }))}
      totalAmount={cart.reduce((total, item) => total + (item.price_cents * item.quantity), 0)}
      showCart={cart.length > 0}
      onCheckout={() => {
        // TODO: Implement checkout
        console.log('Checkout clicked');
      }}
      onUpdateQuantity={(itemId, quantity) => {
        setCart(prev => prev.map(item => 
          item.id === itemId ? { ...item, quantity } : item
        ));
      }}
      onRemoveItem={(itemId) => {
        setCart(prev => prev.filter(item => item.id !== itemId));
      }}
    >
      <div className="space-y-6" ref={containerRef}>
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold">{venue.name}</h1>
          </div>
          
          {/* Venue description removed - not available in current venue type */}

          {session?.table && (
            <Badge variant="outline" className="w-fit">
              {session.table}
            </Badge>
          )}
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {categories.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <Button
                variant={filterCategory === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory('')}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={filterCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Menu Items */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-4" />
                <Skeleton className="h-8 w-20" />
              </Card>
            ))}
          </div>
        ) : Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-12">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No items found</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterCategory
                  ? 'Try adjusting your search or filters'
                  : 'No menu items available at this time'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([category, items]) => (
              <motion.section
                key={category}
                id={`category-${category.toLowerCase().replace(/\s+/g, '-')}`}
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{category}</h2>
                  <Badge variant="secondary">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      disabled={item.available === false}
                      onAddToCart={(quantity, notes) => addToCart(item, quantity, notes)}
                    />
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default DinerMenu;

