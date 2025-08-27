import DinerMenuClient from './client'

interface DinerMenuPageProps {
  params: Promise<{ venueSlug: string }>
}

export default async function DinerMenuPage({ params }: DinerMenuPageProps) {
  const { venueSlug } = await params
  
  return <DinerMenuClient venueSlug={venueSlug} />
}
