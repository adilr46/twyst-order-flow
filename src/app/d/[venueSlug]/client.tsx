"use client";

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DinerMenu from '@/components/diner/DinerMenu'

interface DinerMenuClientProps {
  venueSlug: string
}

export default function DinerMenuClient({ venueSlug }: DinerMenuClientProps) {
  const router = useRouter();
  
  // Prefetch likely next routes
  useEffect(() => {
    router.prefetch(`/d/${venueSlug}/order`);
    router.prefetch(`/o/`);
  }, [router, venueSlug]);
  
  return (
    <Suspense fallback={
      <div className="p-4 text-sm text-gray-500">Loading…</div>
    }>
      <DinerMenu venueSlug={venueSlug} />
    </Suspense>
  )
}
