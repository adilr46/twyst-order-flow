import TableTokenGuard from '@/components/guards/TableTokenGuard'
import { redirect } from 'next/navigation'

interface OrderStatusPageProps {
  params: Promise<{ venueSlug: string }>
}

export default async function OrderStatusPage({ params }: OrderStatusPageProps) {
  const { venueSlug } = await params
  
  // Redirect to the new order-status route
  redirect('/order-status')
}
