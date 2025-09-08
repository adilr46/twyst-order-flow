"use client";

import DinerMenu from '@/components/diner/DinerMenu'

interface DinerMenuClientProps {
  venueSlug: string
}

export default function DinerMenuClient({ venueSlug }: DinerMenuClientProps) {
  return <DinerMenu venueSlug={venueSlug} />
}
