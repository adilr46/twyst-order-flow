# Twyst Modern UI Design System

## Overview

A comprehensive design system for a modern, tech-savvy dining app that conveys safety, speed, and innovation. Built with mobile-first principles, consistent spacing, and smooth animations to create a premium fintech/food app experience.

## Design Principles

### 1. **Safe to Pay** 
- Clean, trustworthy visual hierarchy
- Consistent 12px border radius for familiarity
- Soft shadows and subtle gradients
- Clear status indicators with appropriate colors

### 2. **Modern & Fast**
- Smooth animations with easing curves
- Instant visual feedback on interactions
- Progressive disclosure of information
- Clean typography with Geist font family

### 3. **Better Than Paper Menus**
- Interactive cards with hover states
- Rich media integration capabilities
- Real-time status updates
- Contextual actions and shortcuts

## Design Tokens

### Colors

#### Primary - Bold Clean Blue
- **Primary 500**: `#3b82f6` (Main brand color)
- **Primary 600**: `#2563eb` (Hover states)
- **Primary 50-950**: Full scale for variations

#### Neutral Grays
- **Neutral 50**: `#fafafa` (Light backgrounds)
- **Neutral 500**: `#737373` (Text secondary)
- **Neutral 900**: `#171717` (Text primary)

#### Accent Green
- **Accent 500**: `#22c55e` (Success, positive actions)
- Used for: Success states, "Add to Cart", positive confirmations

#### Subtle Red
- **Destructive 500**: `#ef4444` (Errors, cancellations)
- Used sparingly for: Error states, destructive actions

### Typography

#### Font Family
- **Primary**: Geist (Clean, modern sans-serif)
- **Monospace**: Geist Mono (For order numbers, prices)

#### Scale
- **Text XS**: 12px (Badges, captions)
- **Text SM**: 14px (Body text, descriptions)
- **Text Base**: 16px (Primary text)
- **Text LG**: 18px (Headings)
- **Text XL+**: 20px+ (Display headings)

### Spacing Scale

Consistent 4px base unit:
- **1**: 4px
- **2**: 8px  
- **3**: 12px (Primary spacing unit)
- **4**: 16px
- **6**: 24px
- **8**: 32px
- **12**: 48px

### Border Radius

Consistent **12px** radius across all components:
- **MD**: 12px (Primary radius for cards, buttons, inputs)
- **SM**: 4px (Small elements, badges)
- **LG**: 16px (Large containers)
- **Full**: 9999px (Circular elements)

### Shadows

Layered shadow system:
- **Soft**: Subtle elevation for cards
- **Soft-MD**: Medium elevation for interactive elements
- **Soft-LG**: High elevation for modals, dropdowns
- **Glow**: Special highlight effect for primary actions
- **Card-Hover**: Interactive feedback

## Component System

### Button Hierarchy

#### Primary Actions (Checkout/Add)
```tsx
<Button variant="primary" size="lg">
  <ShoppingCart className="mr-2" />
  Checkout
</Button>
```
- Bold blue background
- Glow effect on hover
- Scale animation (105%)
- Used for: Checkout, Add to Cart, Order Now

#### Secondary Actions
```tsx
<Button variant="secondary">
  View Details
</Button>
```
- Neutral background with border
- Subtle hover effects
- Used for: View Details, Cancel, Back

#### Ghost Actions
```tsx
<Button variant="ghost">
  <Heart className="mr-2" />
  Favorite
</Button>
```
- Transparent background
- Hover state reveals background
- Used for: Less important actions, icons

### Card System

#### Interactive Cards
```tsx
<Card variant="interactive">
  <CardContent>
    Menu item with hover effects
  </CardContent>
</Card>
```
- Hover scale effect (101%)
- Shadow elevation on hover
- Smooth transitions

#### Elevated Cards
```tsx
<Card variant="elevated">
  <CardContent>
    Important content with prominence
  </CardContent>
</Card>
```
- Higher initial shadow
- Used for: Key information, CTAs

### Status System

#### Order Status Badges
```tsx
<Badge variant="pending">Pending</Badge>
<Badge variant="preparing">Preparing</Badge>
<Badge variant="ready">Ready</Badge>
<Badge variant="completed">Completed</Badge>
```
- Color-coded with semantic meaning
- Subtle animations for active states
- Icons for better recognition

### Motion System

#### Timing Functions
- **Fast**: 150ms for micro-interactions
- **Smooth**: 300ms for standard transitions
- **Bounce**: 500ms for playful feedback

#### Easing Curves
- **Ease-out**: `cubic-bezier(0.16, 1, 0.3, 1)` (Natural deceleration)
- **Bounce**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` (Playful feedback)

#### Key Animations
- **Scale on hover**: 105% for buttons, 101% for cards
- **Slide up**: Sheet/modal entrances
- **Fade in**: Toast notifications, content loading
- **Bounce gentle**: Ready status indicators

## Layout System

### Mobile-First Responsive
- **Container**: Max-width with responsive padding
- **Grid**: Auto-fit grid with 280px minimum columns
- **Spacing**: Consistent vertical rhythm

### Sticky Elements
- **Cart Bar**: Fixed bottom positioning with backdrop blur
- **Header**: Sticky navigation with elevation shadow

## Background Graphics

### Subtle Tech Feel
- **Hero gradients**: Subtle radial gradients with brand colors
- **SVG patterns**: Minimal dot patterns at low opacity
- **Waves**: Organic shapes for visual interest
- **Glassmorphism**: Backdrop blur effects for overlays

## Usage Guidelines

### Do's
- ✅ Use consistent 12px radius across components
- ✅ Apply smooth transitions to all interactive elements
- ✅ Maintain clear visual hierarchy with button variants
- ✅ Use semantic colors for status indicators
- ✅ Implement mobile-first responsive design

### Don'ts
- ❌ Mix different border radius values
- ❌ Use harsh shadows or gradients
- ❌ Overuse animations or make them too fast
- ❌ Use primary color for non-critical actions
- ❌ Forget hover states on interactive elements

## Implementation

### CSS Classes
```css
/* Modern button with all effects */
.btn-primary {
  @apply bg-primary text-primary-foreground rounded-md px-6 py-3;
  @apply shadow-glow hover:shadow-glow hover:scale-105;
  @apply transition-all duration-200 ease-out;
}

/* Interactive card */
.card-interactive {
  @apply bg-card rounded-md border shadow-soft;
  @apply hover:shadow-card-hover hover:scale-[1.01];
  @apply transition-all duration-200 ease-out;
}
```

### React Components
All components built with:
- TypeScript for type safety
- Radix UI primitives for accessibility
- Class Variance Authority for variant management
- Tailwind CSS for styling

## File Structure

```
src/components/ui/
├── button.tsx           # Enhanced button with variants
├── card.tsx             # Modern card system
├── badge.tsx            # Status badges
├── background-graphics.tsx # Subtle background elements
├── cart-bar.tsx         # Sticky cart with animations
├── order-history.tsx    # Fintech-inspired order list
└── toast-modern.tsx     # Smooth notifications
```

## Accessibility

- **Focus states**: Clear ring indicators
- **Color contrast**: WCAG AA compliant
- **Screen readers**: Semantic HTML and ARIA labels
- **Keyboard navigation**: Full keyboard support
- **Motion preferences**: Respects reduced motion settings

This design system creates a cohesive, modern experience that builds trust, feels fast, and provides a superior alternative to traditional paper menus.



