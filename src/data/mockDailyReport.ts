// TODO: Replace with real database data from Supabase/Prisma
// This mock data simulates a daily sales report for demo purposes

export interface DailyReport {
  rangeUTC: {
    start: string;
    end: string;
  };
  generatedAt: string;
  totalOrders: number;
  revenue: number; // in GBP
  averageOrderValue: number; // in GBP
  topItems: Array<{
    id: string;
    name: string;
    qty: number;
  }>;
  peakHourUTC: number;
  peakHourCount: number;
}

export const mockDailyReport: DailyReport = {
  rangeUTC: {
    start: "2024-01-15T00:00:00.000Z",
    end: "2024-01-15T23:59:59.999Z"
  },
  generatedAt: "2024-01-16T09:00:00.000Z",
  totalOrders: 47,
  revenue: 1247.83,
  averageOrderValue: 26.55,
  topItems: [
    {
      id: "item-1",
      name: "Chicken Burger",
      qty: 23
    },
    {
      id: "item-2", 
      name: "Fries",
      qty: 18
    },
    {
      id: "item-3",
      name: "Veggie Wrap",
      qty: 12
    },
    {
      id: "item-4",
      name: "Coca Cola",
      qty: 15
    },
    {
      id: "item-5",
      name: "Salad",
      qty: 8
    }
  ],
  peakHourUTC: 18,
  peakHourCount: 8
};
