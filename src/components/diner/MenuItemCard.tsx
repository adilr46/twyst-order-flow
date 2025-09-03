"use client"

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Plus, Minus } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'

interface MenuItemCardProps {
  item: {
    id: string
    name: string
    description: string
    price_cents: number
    category: string
  }
  qty: number
  onAdd: () => void
  onInc: () => void
  onDec: () => void
}

export default function MenuItemCard({ 
  item, 
  qty, 
  onAdd, 
  onInc, 
  onDec 
}: MenuItemCardProps) {
  const { toast } = useToast()

  const handleAdd = () => {
    onAdd()
    toast({
      description: `Added ${item.name} to cart`,
      duration: 2000,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      whileTap={{ scale: 0.98 }}
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      {/* Name and Price Row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-gray-900 truncate flex-1">
          {item.name}
        </h3>
        <span className="text-sm font-medium text-gray-600 shrink-0">
          {formatMoney(item.price_cents)}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
        {item.description}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-end">
        {qty === 0 ? (
          <Button
            onClick={handleAdd}
            size="sm"
            className="h-9 px-3 rounded-lg"
            aria-label={`Add ${item.name} to cart`}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <motion.button
              onClick={onDec}
              whileTap={{ scale: 0.92 }}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-red-600 hover:text-white active:bg-red-700 transition-colors duration-150"
              aria-label={`Decrease quantity of ${item.name}`}
            >
              <Minus className="h-3 w-3" />
            </motion.button>
            
            <span className="w-8 text-center font-medium text-sm">
              {qty}
            </span>
            
            <motion.button
              onClick={onInc}
              whileTap={{ scale: 0.92 }}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-green-600 hover:text-white active:bg-green-700 transition-colors duration-150"
              aria-label={`Increase quantity of ${item.name}`}
            >
              <Plus className="h-3 w-3" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
