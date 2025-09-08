"use client";

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ShoppingCart, Eye } from 'lucide-react';

type ItemRow = { qty: number; name: string };

export default function OrderItemsPopover({ items }: { items: ItemRow[] }) {
  if (!items || items.length === 0) {
    return <span className="text-sm text-muted-foreground">No items</span>;
  }

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const itemCount = items.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-between text-xs font-normal h-7 bg-gray-50 hover:bg-gray-100 border-gray-200"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-3 w-3" />
            <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
            {itemCount > 1 && (
              <span className="text-xs text-muted-foreground">
                ({itemCount} types)
              </span>
            )}
          </div>
          <Eye className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-4 z-[100] bg-white border-2 border-gray-200 shadow-xl" 
        align="start" 
        side="top"
        sideOffset={8}
        avoidCollisions={true}
        collisionPadding={16}
      >
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-900">Order Items</h4>
          <div className="h-px bg-gray-200"></div>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm font-medium text-gray-900 flex-1 mr-2" title={item.name}>
                  {item.name}
                </span>
                <span className="text-sm text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded-full">
                  ×{item.qty}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-900">Total Items:</span>
              <span className="font-medium text-gray-900">{totalItems}</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}