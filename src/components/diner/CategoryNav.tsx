"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  label: string
  count?: number
}

interface CategoryNavProps {
  categories?: Category[]
  activeCategory?: string
  onCategoryChange?: (categoryId: string) => void
  className?: string
}

const defaultCategories: Category[] = [
  { id: "coffee", label: "Coffee", count: 12 },
  { id: "pastries", label: "Pastries", count: 8 },
  { id: "sandwiches", label: "Sandwiches", count: 6 },
  { id: "salads", label: "Salads", count: 5 },
  { id: "beverages", label: "Beverages", count: 10 },
  { id: "desserts", label: "Desserts", count: 7 },
]

export default function CategoryNav({ 
  categories = defaultCategories, 
  activeCategory,
  onCategoryChange,
  className 
}: CategoryNavProps) {
  const [localActive, setLocalActive] = React.useState<string>()
  
  const handleCategoryClick = (categoryId: string) => {
    setLocalActive(categoryId)
    onCategoryChange?.(categoryId)
    
    // Smooth scroll to section
    const element = document.getElementById(categoryId)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  // Use intersection observer to track active section
  React.useEffect(() => {
    const observers: IntersectionObserver[] = []
    
    categories.forEach(category => {
      const element = document.getElementById(category.id)
      if (!element) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setLocalActive(category.id)
          }
        },
        {
          rootMargin: `-${56 + 44 + 24}px 0px -50% 0px`, // Account for sticky headers
          threshold: 0.1
        }
      )

      observer.observe(element)
      observers.push(observer)
    })

    return () => {
      observers.forEach(observer => observer.disconnect())
    }
  }, [categories])

  const currentActive = activeCategory || localActive

  return (
    <nav className={cn("h-catnav flex items-center", className)}>
      <div className="flex gap-2 overflow-x-auto no-scrollbar category-nav-scroll py-2 -ml-1 pr-1">
        {categories.map((category) => {
          const isActive = currentActive === category.id
          
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                "category-nav-item shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium",
                "tap-target transition-all duration-200 ease-out",
                "hover:scale-105 active:scale-95",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent/50"
              )}
            >
              <span>{category.label}</span>
              {category.count && (
                <span className={cn(
                  "ml-1.5 text-xs",
                  isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {category.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}



