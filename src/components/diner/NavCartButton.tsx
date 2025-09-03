"use client"

import { motion } from 'framer-motion'

interface NavCartButtonProps {
  count: number
  onOpen: () => void
}

export default function NavCartButton({ count, onOpen }: NavCartButtonProps) {
  return (
    <motion.button
      onClick={onOpen}
      whileTap={{ scale: 0.95 }}
      aria-label={`Open cart (${count} items)`}
      className="
        group relative h-10 px-3 rounded-full border border-gray-300
        bg-white text-gray-700
        flex items-center gap-2
        hover:bg-green-600 hover:text-white
        active:bg-green-700
        transition-colors duration-150
        shadow-sm
      "
    >
      <span className="text-base">🛒</span>
      {count > 0 && (
        <span
          className="
            inline-flex h-5 min-w-[1.25rem] items-center justify-center
            px-1 rounded-full text-xs font-medium
            bg-gray-800 text-white
            group-hover:bg-gray-900
            transition-colors duration-150
          "
          aria-hidden="true"
        >
          {count}
        </span>
      )}
    </motion.button>
  )
}
