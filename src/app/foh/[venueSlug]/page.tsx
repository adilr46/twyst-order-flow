import FOHOrderBoard from '@/pages/FOHOrderBoard'

interface FOHOrderBoardPageProps {
  params: Promise<{ venueSlug: string }>
}

export default async function FOHOrderBoardPage({ params }: FOHOrderBoardPageProps) {
  const { venueSlug } = await params
  
  return <FOHOrderBoard venueSlug={venueSlug} />
}
