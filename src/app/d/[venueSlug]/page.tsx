import { Suspense } from 'react'
import DinerMenuClient from './client'

interface DinerMenuPageProps {
  params: Promise<{ venueSlug: string }>
}

export default async function DinerMenuPage({ params }: DinerMenuPageProps) {
  const { venueSlug } = await params
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    }>
      <DinerMenuClient venueSlug={venueSlug} />
    </Suspense>
  )
}
