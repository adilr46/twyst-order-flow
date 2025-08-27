import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary: Bold blue for main actions (Checkout/Add)
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 ease-out",
        
        // Primary with glow effect for key CTAs
        primary: "bg-primary text-primary-foreground shadow-glow hover:bg-primary/90 hover:shadow-glow hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200 ease-out",
        
        // Destructive: Subtle red
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 ease-out",
        
        // Secondary: Clean neutral for secondary actions
        secondary: "bg-secondary text-secondary-foreground border border-input shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 ease-out",
        
        // Outline: Minimal border style
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 ease-out",
        
        // Ghost: Subtle hover states
        ghost: "hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95 transition-all duration-200 ease-out",
        
        // Success: Green accent for positive actions
        success: "bg-accent text-accent-foreground shadow-sm hover:bg-accent/90 hover:shadow-glow-accent hover:scale-105 active:scale-95 transition-all duration-200 ease-out",
        
        // Link: Text-only style
        link: "text-primary underline-offset-4 hover:underline hover:scale-105 transition-all duration-200 ease-out",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-xs",
        default: "h-10 px-4 py-2",
        lg: "h-12 rounded-md px-6 text-base",
        xl: "h-14 rounded-md px-8 text-lg font-semibold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
