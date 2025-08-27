import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Primary: Bold blue
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        
        // Secondary: Neutral
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        
        // Success: Green for positive status
        success: "border-accent/20 bg-accent/10 text-accent hover:bg-accent/20",
        
        // Warning: Yellow for pending/waiting
        warning: "border-warning/20 bg-warning/10 text-warning hover:bg-warning/20",
        
        // Destructive: Red for errors/cancellation
        destructive: "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20",
        
        // Outline: Minimal border style
        outline: "border-border text-foreground hover:bg-accent hover:text-accent-foreground",
        
        // Status variants for orders
        pending: "border-warning/20 bg-warning/10 text-warning animate-pulse",
        preparing: "border-primary/20 bg-primary/10 text-primary",
        ready: "border-accent/20 bg-accent/10 text-accent animate-bounce-gentle",
        completed: "border-muted bg-muted text-muted-foreground",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-3 py-1 text-xs",
        lg: "px-4 py-1.5 text-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
