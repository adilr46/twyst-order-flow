"use client"

import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'

interface NavCartButtonProps {
  count: number
  onOpen: () => void
}

export default function NavCartButton({ count, onOpen }: NavCartButtonProps) {
  return (
    <motion.button
      onClick={onOpen}
      whileHover={{ scale: 1.08, y: -3 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      aria-label={`Open cart (${count} items)`}
      className="
        group relative h-12 px-4 rounded-2xl border border-transparent
        bg-[#1e3a8a] text-white
        flex items-center gap-3
        hover:bg-[#1e40af]
        active:scale-95
        transition-all duration-300 ease-out
        shadow-lg hover:shadow-xl hover:shadow-blue-500/30
        font-bold text-sm
        cursor-pointer
      "
    >
      <motion.div 
        className="text-white"
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        <ShoppingCart className="w-5 h-5" />
      </motion.div>
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="
            inline-flex h-6 min-w-[1.5rem] items-center justify-center
            px-2 rounded-xl text-xs font-bold
            bg-white text-[#1e3a8a]
            group-hover:bg-gray-50
            transition-all duration-300 ease-out
            shadow-md group-hover:shadow-lg
            border border-gray-200
          "
          aria-hidden="true"
        >
          {count}
        </motion.span>
      )}
    </motion.button>
  )
}
