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
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-gray-100">
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
              relative whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold
              border border-transparent
              text-body bg-white
              hover:bg-gray-100 hover:text-gray-600
              active:bg-gray-200
              transition-colors duration-200 ease-in-out
              ${active === tab ? "text-heading bg-gray-50" : ""}
            `}
          >
            {toTitleCase(tab)}
            {counts && counts[tab] > 0 && (
              <span className="ml-1 text-xs opacity-60">({counts[tab]})</span>
            )}
            
            {active === tab && (
              <span className="absolute -bottom-[2px] left-2 right-2 h-0.5 rounded bg-primary-600" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
