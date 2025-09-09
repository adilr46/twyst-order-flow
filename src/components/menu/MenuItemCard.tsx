"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MenuItem, CartItem } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, normalizePrice } from '@/utils/price';

interface MenuItemCardProps {
  item: MenuItem;
  disabled?: boolean;
  onAddToCart?: (quantity: number, notes?: string) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, disabled = false }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Ensure price is in cents format for internal use
  const itemPriceCents = item.price_cents || normalizePrice(item.price_cents);

  const handleAddToCart = async (quantity: number = 1) => {
    if (disabled) {
      toast({
        title: "Table scan required",
        description: "Please scan your table tag to start ordering.",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    
    const cartItem: CartItem = {
      ...item,
      price_cents: itemPriceCents, // Ensure cents format
      qty: quantity,
      specialInstructions: specialInstructions.trim() || undefined
    };

    await new Promise(resolve => setTimeout(resolve, 300)); // Smooth animation
    
    addToCart(cartItem);
    
    toast({
      title: "Added to cart!",
      description: `${item.name} has been added to your cart.`,
    });
    
    setIsAdding(false);
    setIsDialogOpen(false);
    setSpecialInstructions('');
  };

  const handleQuickAdd = () => {
    handleAddToCart(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="menu-card overflow-hidden border rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col"
    >
      {item.image && (
        <div className="aspect-video bg-muted rounded-t-xl overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight">{item.name}</h3>
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
              {item.description}
            </p>
          </div>
          
          <div className="text-right">
            <p className="font-bold text-lg text-primary">{formatPrice(itemPriceCents)}</p>
            {!item.available && (
              <Badge variant="secondary" className="mt-1">
                Unavailable
              </Badge>
            )}
          </div>
        </div>

        {item.dietary && item.dietary.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.dietary.map((diet) => (
              <Badge key={diet} variant="outline" className="text-xs">
                {diet}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2 mt-auto">
          <Button
            onClick={handleQuickAdd}
            disabled={!item.available || isAdding || disabled}
            className="flex-1 animate-bounce-scale"
            variant="default"
          >
            {isAdding ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Added!
              </motion.div>
            ) : disabled ? (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Scan Table to Order
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="default"
                disabled={!item.available || disabled}
                className="animate-bounce-scale"
              >
                {disabled ? 'Scan Table' : 'Customize'}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">{item.name}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <p className="text-muted-foreground mb-2">{item.description}</p>
                  <p className="font-semibold text-primary text-lg">{formatPrice(itemPriceCents)}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Special Instructions (Optional)</label>
                  <Textarea
                    placeholder="Any modifications or special requests..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={() => handleAddToCart(1)}
                  disabled={isAdding || disabled}
                  className="w-full cart-button"
                  size="lg"
                >
                  {isAdding ? (
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Adding...
                    </div>
                  ) : disabled ? (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Scan Table to Order
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Cart - {formatPrice(itemPriceCents)}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </motion.div>
  );
};