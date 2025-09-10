import FOHOrderBoard from '@/components/foh/FOHOrderBoard';
import DailySalesSummaryCard from '@/components/admin/DailySalesSummaryCard';

export default async function FOHOrderBoardPage({ params }: { params: Promise<{ venueSlug: string }> }) {
  const { venueSlug } = await params;
  
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">FOH Dashboard</h1>
        
        {/* Daily Sales Summary Card - Comment out to hide */}
        <div className="mb-8">
          <DailySalesSummaryCard />
        </div>
        
        {/* Existing Order Board */}
        <FOHOrderBoard venueSlug={venueSlug} />
      </div>
    </main>
  );
}