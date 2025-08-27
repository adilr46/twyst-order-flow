"use client";

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { SessionProvider } from '@/contexts/SessionContext';
import { CartProvider } from '@/contexts/CartContext';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

interface ClientProvidersProps {
  children: React.ReactNode;
}

/**
 * ClientProviders - Centralized client-side provider wrapper
 * 
 * This component wraps all client-side providers needed by the app:
 * - QueryClientProvider: React Query for data fetching
 * - SessionProvider: Supabase session management (client-side)
 * - CartProvider: Shopping cart state management
 * - TooltipProvider: UI tooltip functionality
 * - Toaster components: Toast notifications
 * 
 * This is imported by the server-side layout.tsx to establish
 * clean server/client boundaries.
 */
export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </CartProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}



