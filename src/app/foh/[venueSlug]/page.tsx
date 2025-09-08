import FOHOrderBoard from '@/components/foh/FOHOrderBoard';

export default async function FOHOrderBoardPage({ params }: { params: Promise<{ venueSlug: string }> }) {
  const { venueSlug } = await params;
  return <FOHOrderBoard venueSlug={venueSlug} />;
}