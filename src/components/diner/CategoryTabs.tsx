"use client"

import { motion } from 'framer-motion'
import { toTitleCase, type FixedCategory } from '@/utils/categoryOrder'

interface CategoryTabsProps {
  tabs: FixedCategory[]
  active: FixedCategory
  onChange: (tab: FixedCategory) => void
  counts?: Record<FixedCategory, number>
}

export default function CategoryTabs({ tabs, active, onChange, counts }: CategoryTabsProps) {
  // Guard against invalid tabs array
  const safeTabs = Array.isArray(tabs) ? tabs : [];
  
  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b">
      <div 
        className="flex overflow-x-auto gap-3 px-4 py-2"
        role="tablist"
        aria-label="Menu categories"
      >
        {safeTabs.map((tab) => (
          <motion.button
            key={`tab-${tab}`}
            role="tab"
            aria-selected={active === tab}
            onClick={() => onChange(tab)}
            whileTap={{ scale: 0.95 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onChange(tab)
              }
            }}
            className={`
              relative whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium
              border border-transparent
              text-gray-700 bg-white
              hover:bg-green-600 hover:text-white
              active:bg-green-700
              transition-colors duration-150
              ${active === tab ? "text-gray-900" : ""}
            `}
          >
            {toTitleCase(tab)}
            {counts && counts[tab] > 0 && (
              <span className="ml-1 text-xs opacity-60">({counts[tab]})</span>
            )}
            
            {active === tab && (
              <span className="absolute -bottom-[2px] left-2 right-2 h-0.5 rounded bg-gray-900" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
