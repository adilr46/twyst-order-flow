"use client";

import { SessionProvider } from '@/contexts/SessionContext';

export default function TableTokenGuard({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}