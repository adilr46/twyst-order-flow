import FOHOrderBoard from '@/components/foh/FOHOrderBoard';

export default function FOHOrderBoardPage({ params }: { params: { venueSlug: string } }) {
  return <FOHOrderBoard venueSlug={params.venueSlug} />;
}