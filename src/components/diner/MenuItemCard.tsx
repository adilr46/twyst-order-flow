"use client"

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Plus, Minus } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import Image from 'next/image'

interface MenuItemCardProps {
  item: {
    id: string
    name: string
    description?: string
    price_cents: number
    category?: string
  }
  qty: number
  onAdd: () => void
  onInc: () => void
  onDec: () => void
  venueSlug?: string
}

export default function MenuItemCard({ 
  item, 
  qty, 
  onAdd, 
  onInc, 
  onDec,
  venueSlug = 'demo-cafe'
}: MenuItemCardProps) {

  // Generate image path for local images
  const getImagePath = () => {
    const category = item.category?.toLowerCase() || 'misc';
    const fileName = item.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9-]/g, '');
    
    // Map specific items to their actual file extensions based on your files
    const imageExtensions: Record<string, string> = {
      // Appetizers
      'garlic-bread': '.jpg.jpg',
      'bruschetta': '.jpg.webp',
      'soup-of-the-day': '.jpg.webp',
      'calamari': '.jpg.png',
      'caprese-salad': '.jpg.webp',
      
      // Mains
      'grilled-chicken-sandwich': '.jpg.jpg',
      'beef-burger': '.jpg.avif',
      'caesar-salad': '.jpg.jpg',
      'pasta-carbonara': '.jpg.jpg',
      'fish-and-chips': '.jpg.jpg',
      
      // Desserts
      'chocolate-cake': '.jpg.jpg',
      'tiramisu': '.jpg.jpg',
      'apple-pie': '.jpg.jpg',
      'cheesecake': '.jpg.jpg',
      'ice-cream-sundae': '.jpg.jpg',
      
      // Drinks
      'cappuccino': '.jpg.jpg',
      'latte': '.jpg.jpg',
      'americano': '.jpg.jpg',
      'hot-chocolate': '.jpg.jpg',
      'fresh-orange-juice': '.jpg.webp'
    };
    
    const extension = imageExtensions[fileName] || '.jpg.jpg';
    const imagePath = `/images/${venueSlug}/${category}/${fileName}${extension}`;
    return imagePath;
  };

  const handleAdd = () => {
    onAdd()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="bg-gray-50 rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:shadow-blue-500/10 hover:scale-[1.02] transition-all duration-300"
    >
      {/* Left-Right Layout */}
      <div className="flex gap-5 p-6">
        {/* Left Side - Text Content (60-70% width) */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 leading-tight">
              {item.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="inline-block -rotate-1 bg-gradient-to-br from-[#F9E4C9] to-[#F6DFAE] px-2 py-1 text-[#111827] font-bold shadow-sm rounded-md">
                {formatMoney(item.price_cents)}
              </span>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-start">
            {qty === 0 ? (
              <motion.button
                onClick={handleAdd}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-full max-w-[200px] bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold py-3 px-5 rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25"
                aria-label={`Add ${item.name} to cart`}
              >
                <Plus className="w-5 h-5" />
                <span>Add</span>
              </motion.button>
            ) : (
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={onDec}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-10 w-10 flex items-center justify-center rounded-2xl border-2 border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 shadow-md hover:shadow-lg transition-all duration-200"
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  <Minus className="h-4 w-4" />
                </motion.button>

                <span className="w-10 text-center font-bold text-base text-gray-900 bg-gray-50 rounded-2xl h-10 flex items-center justify-center border-2 border-gray-200">
                  {qty}
                </span>

                <motion.button
                  onClick={onInc}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-10 w-10 flex items-center justify-center rounded-2xl border-2 border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 shadow-md hover:shadow-lg transition-all duration-200"
                  aria-label={`Increase quantity of ${item.name}`}
                >
                  <Plus className="h-4 w-4" />
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Image (30-40% width) */}
        <div className="flex-shrink-0 w-32 h-32 sm:w-36 sm:h-36">
          <div className="relative w-full h-full bg-gray-50 rounded-xl overflow-hidden shadow-sm">
            <Image 
              src={getImagePath()}
              alt={item.name}
              fill
              className="object-cover object-center"
              sizes="(max-width: 640px) 128px, (max-width: 768px) 144px, 180px"
              onError={(e) => {
                // Fallback to placeholder if image doesn't exist
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="absolute inset-0 bg-gray-50 rounded-xl flex items-center justify-center" style={{display: 'none'}}>
              <div className="text-gray-400 text-xs text-center">
                <div className="w-8 h-8 mx-auto mb-1 bg-gray-200 rounded"></div>
                <div>Image</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
