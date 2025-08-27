"use client";

import TableTokenGuard from '@/components/guards/TableTokenGuard'
import DinerMenu from '@/components/diner/DinerMenu'

interface DinerMenuClientProps {
  venueSlug: string
}

export default function DinerMenuClient({ venueSlug }: DinerMenuClientProps) {
  return (
    <TableTokenGuard>
      <DinerMenu venueSlug={venueSlug} />
    </TableTokenGuard>
  )
}
