"use client";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

type ItemRow = { qty: number; name: string };

export default function OrderItemsPopover({ items }: { items: ItemRow[] }) {
  if (!items || items.length === 0) {
    return <span className="text-sm text-muted-foreground">No items</span>;
  }

  if (items.length <= 2) {
    return (
      <span className="text-sm">
        {items.map((i, idx) => (
          <span key={idx}>
            {i.qty}× {i.name}
            {idx < items.length - 1 ? ", " : ""}
          </span>
        ))}
      </span>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          View items ({items.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 rounded-2xl">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Order Items</h4>
          <ul className="space-y-1 text-sm">
            {items.map((i, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{i.qty}× {i.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}