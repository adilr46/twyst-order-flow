import { mockDailyReport } from '@/data/mockDailyReport';

// Helper function to format hour ranges
function formatHourRange(hour: number): string {
  const startHour = hour.toString().padStart(2, '0');
  const endHour = (hour + 1).toString().padStart(2, '0');
  return `${startHour}:00–${endHour}:00 UTC`;
}

// Helper function to format GBP currency
function formatGBP(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
}

// Helper function to format date
function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Helper function to format time
function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
}

// Stat subcomponent for individual stat boxes
interface StatProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}

function Stat({ label, value, icon, className = "" }: StatProps) {
  return (
    <div className={`bg-white rounded-xl p-4 border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DailySalesSummaryCard() {
  const report = mockDailyReport;

  return (
    <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Daily Sales Summary</h2>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(report.rangeUTC.start)} • {formatTime(report.generatedAt)} UTC
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Auto-generated · 9:00
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat
          label="Total Orders"
          value={report.totalOrders}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <Stat
          label="Revenue"
          value={formatGBP(report.revenue)}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />
        <Stat
          label="Avg Order Value"
          value={formatGBP(report.averageOrderValue)}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <Stat
          label="Peak Hour"
          value={formatHourRange(report.peakHourUTC)}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Top Items */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Items</h3>
        <div className="space-y-3">
          {report.topItems.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 mr-3">
                  {index + 1}
                </div>
                <span className="text-gray-900 font-medium">{item.name}</span>
              </div>
              <span className="text-gray-600 font-semibold">{item.qty} sold</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            <span className="font-medium">Date Range:</span> {formatDate(report.rangeUTC.start)} - {formatDate(report.rangeUTC.end)}
          </div>
          <div>
            <span className="font-medium">Generated:</span> {formatTime(report.generatedAt)} UTC
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-400 text-center">
          Beta: Auto-email at 9am coming next week.
        </div>
      </div>
    </div>
  );
}
