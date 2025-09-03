"use client";

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function PaymentSuccessPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const orderId = sp?.get('orderId');
  const venue = sp?.get('venue');
  const t = sp?.get('t');

  const statusHref = `/order-status?orderId=${orderId}${t ? `&t=${encodeURIComponent(t)}` : ''}`;

  useEffect(() => {
    if (!orderId) return;
    
    const id = setTimeout(() => {
      router.replace(statusHref);
    }, 3500);
    
    return () => clearTimeout(id);
  }, [orderId, router, statusHref]);

  if (!orderId) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-red-600">Payment Error</h1>
        <p className="text-muted-foreground mt-2">Order ID not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 text-center space-y-6">
      <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
      <h1 className="text-2xl font-bold">Payment confirmed</h1>
      <p className="text-muted-foreground">We're syncing your order with the kitchen.</p>
      <div className="flex justify-center gap-3">
        <Button onClick={() => router.replace(statusHref)}>
          View order status <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        {venue && (
          <Button variant="ghost" onClick={() => router.replace(`/d/${venue}`)}>
            Go back to menu
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Redirecting in a few seconds…</p>
    </div>
  );
}

