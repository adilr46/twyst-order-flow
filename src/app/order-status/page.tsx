"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle, ChefHat, Loader2, CreditCard, Users, Utensils, Bell, Info } from 'lucide-react';
import OrderLoadingSpinner from '@/components/ui/OrderLoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
// Removed complex supabaseForOrder - using simple client
import { getStatusDescription, getStatusColor, type OrderStatus } from '@/utils/orderTransitions';
// import HeaderShell from '@/components/layout/HeaderShell';

// src/app/order-status/page.tsx - Replace lines 20-48:
interface OrderData {
  id: string;
  status: OrderStatus;
  payment_intent?: string | null;
  total_cents: number;
  subtotal_cents: number;
  tax_cents: number;
  created_at: string;
  venues: {
    name: string;
    slug: string;
  }[]; // Array, not single object
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price_cents: number;
    notes?: string;
    items: {
      name: string;
      description?: string;
    }[]; // Array, not single object
  }>;
  sessions: {
    tables: {
      label: string;
    }[];
  }[]; // Array, not single object
}

interface OrderStatusProps {
  venueSlug: string;
}

export default function OrderStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams?.get('orderId');
  const token = searchParams?.get('t');
  const { toast } = useToast();
  
  // Use scoped client if JWT token is available
  const supabaseClient = supabase; // Simplified for pilot
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justPaid, setJustPaid] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to determine payment status from order status
  const getPaymentStatus = (status: OrderStatus, paymentIntent?: string | null): 'pending' | 'paid' => {
    if (status === 'created' && !paymentIntent) return 'pending';
    if (status === 'paid' || paymentIntent) return 'paid';
    return 'pending';
  };

  // Fetch order data
  // Replace the fetchOrder function (lines 74-139) with this corrected version:

const fetchOrder = async () => {
  if (!orderId) {
    setError('No order ID provided');
    setLoading(false);
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .select(`
        id,
        status,
        payment_intent,
        total_cents,
        subtotal_cents,
        tax_cents,
        created_at,
        venues (
          name,
          slug
        ),
        order_items (
          id,
          quantity,
          unit_price_cents,
          notes,
          items (
            name,
            description
          )
        ),
        sessions (
          tables (
            label
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      setError('Failed to load order details');
      return;
    }

    if (!data) {
      setError('Order not found');
      return;
    }

    // Convert the response to match our interface structure
    const orderData: OrderData = {
      ...(data as any),
      // Ensure venues is an array
      venues: Array.isArray((data as any).venues) ? (data as any).venues : [(data as any).venues],
      // Ensure order_items and nested items are arrays
      order_items: ((data as any).order_items || []).map((item: any) => ({
        ...item,
        items: Array.isArray(item.items) ? item.items : [item.items]
      })),
      // Ensure sessions is an array
      sessions: Array.isArray((data as any).sessions) ? (data as any).sessions : [(data as any).sessions],
    } as OrderData;
    
    setOrder(orderData);
  } catch (err: any) {
    console.error('Failed to fetch order:', err);
    setError(err.message || 'Failed to load order details');
  } finally {
    setLoading(false);
  }
};

// Replace the polling useEffect (around lines 141-171) with this:

useEffect(() => {
  if (!orderId || !order) return;
  const currentPaymentStatus = getPaymentStatus(order.status, order.payment_intent);
  if (currentPaymentStatus !== 'pending') return;

  let cancelled = false;
  const poll = async (attempt = 0) => {
    try {
      const { data, error } = await supabaseClient
        .from('orders')
        .select('status, payment_intent')
        .eq('id', orderId)
        .single();

      if (cancelled) return;
      
      if (error) {
        console.warn('Polling error:', error);
        const delay = Math.min(1000 * Math.pow(1.6, attempt), 10000);
        setTimeout(() => poll(attempt + 1), delay);
        return;
      }

      const newPaymentStatus = getPaymentStatus((data as any).status, (data as any).payment_intent);
      if (newPaymentStatus === 'paid') {
        setOrder(prev => prev ? { 
          ...prev, 
          status: ((data as any).status as OrderStatus) ?? prev.status,
          payment_intent: (data as any).payment_intent ?? prev.payment_intent
        } : prev);
        return;
      }
      
      // No failed status in simplified flow
      
      const delay = Math.min(1000 * Math.pow(1.6, attempt), 10000);
      setTimeout(() => poll(attempt + 1), delay);
    } catch (err) {
      console.warn('Polling error:', err);
      if (!cancelled) {
        const delay = Math.min(1000 * Math.pow(1.6, attempt), 10000);
        setTimeout(() => poll(attempt + 1), delay);
      }
    }
  };
  
  poll();
  return () => { cancelled = true; };
}, [orderId, order?.status, order?.payment_intent, supabaseClient, order]);

// Replace the status polling useEffect (around lines 223-269) with this:

useEffect(() => {
  if (!orderId || !order) return;

  let isSubscribed = true;

  const pollForUpdates = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('orders')
        .select('status, payment_intent')
        .eq('id', orderId)
        .single();
      
      if (error) {
        console.warn('Status polling error:', error);
        return;
      }
      
      if (data && (data as any).status && (data as any).status !== order.status && isSubscribed) {
        const prevStatus = order.status;
        setOrder(prev => prev ? { 
          ...prev, 
          status: (data as any).status as OrderStatus,
          payment_intent: (data as any).payment_intent ?? prev.payment_intent
        } : null);
        
        // Trigger success animation for paid status
        if ((data as any).status === 'paid' && prevStatus !== 'paid') {
          setJustPaid(true);
          setTimeout(() => setJustPaid(false), 2000);
        }
        
        toast({
          title: "Order Updated",
          description: getStatusDescription((data as any).status as OrderStatus),
        });
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  };

  // Poll every 10 seconds
  intervalRef.current = setInterval(pollForUpdates, 10000);

  return () => {
    isSubscribed = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
}, [orderId, order, toast, supabaseClient]);

  // Exponential backoff polling for pending payments
  useEffect(() => {
    if (!orderId || !order) return;
    const currentPaymentStatus = getPaymentStatus(order.status, order.payment_intent);
    if (currentPaymentStatus !== 'pending') return;

    let cancelled = false;
    const poll = async (attempt = 0) => {
      const { data } = await supabaseClient
        .from('orders')
        .select('status, payment_intent')
        .eq('id', orderId)
        .single();

      if (cancelled) return;
      const newPaymentStatus = getPaymentStatus((data as any).status, (data as any).payment_intent);
      if (newPaymentStatus === 'paid') {
        setOrder(prev => prev ? { 
          ...prev, 
          status: ((data as any).status as OrderStatus) ?? prev.status,
          payment_intent: (data as any).payment_intent ?? prev.payment_intent
        } : prev);
        return;
      }
      // No failed status in simplified flow
      const delay = Math.min(1000 * Math.pow(1.6, attempt), 10000);
      setTimeout(() => poll(attempt + 1), delay);
    };
    poll();
    return () => { cancelled = true; };
  }, [orderId, order?.status, order?.payment_intent, supabaseClient, order]);

  // Real-time subscription for order updates
  useEffect(() => {
    if (!orderId || !order) return;

    const subscription = supabaseClient
      .channel('order-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        console.log('Order updated:', payload);
        const newPayload = payload.new as any;
        
        // Guard pending→paid transition
        const newPaymentStatus = getPaymentStatus(newPayload?.status, newPayload?.payment_intent);
        const currentPaymentStatus = getPaymentStatus(order?.status, order?.payment_intent);
        if (newPaymentStatus === 'paid' && currentPaymentStatus !== 'paid') {
          setOrder(prev => prev && { 
            ...prev, 
            status: newPayload?.status as OrderStatus,
            payment_intent: newPayload?.payment_intent ?? prev.payment_intent
          });
          toast({ 
            title: 'Payment confirmed', 
            description: 'Sending to the kitchen.' 
          });
          setJustPaid(true);
          setTimeout(() => setJustPaid(false), 2000);
        }
        
        const newStatus = newPayload.status;
        if (newStatus !== order.status) {
          setOrder(prev => prev ? { ...prev, status: newStatus } : null);
          setLastUpdate(Date.now());
          
          // Show toast notification for status changes
          toast({
            title: "Order Updated",
            description: getStatusDescription(newStatus),
          });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [orderId, order, toast, supabaseClient]);

  // Polling fallback for status updates
  useEffect(() => {
    if (!orderId || !order) return;

    let isSubscribed = true;

    const pollForUpdates = async () => {
      try {
        const { data } = await supabaseClient
          .from('orders')
          .select('status, payment_intent')
          .eq('id', orderId)
          .single();
        
        if (data && (data as any).status && (data as any).status !== order.status && isSubscribed) {
          const prevStatus = order.status;
          setOrder(prev => prev ? { 
            ...prev, 
            status: (data as any).status as OrderStatus,
            payment_intent: (data as any).payment_intent ?? prev.payment_intent
          } : null);
          
          // Trigger success animation for paid status
          if ((data as any).status === 'paid' && prevStatus !== 'paid') {
            setJustPaid(true);
            setTimeout(() => setJustPaid(false), 2000);
          }
          
          toast({
            title: "Order Updated",
            description: getStatusDescription((data as any).status as OrderStatus),
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Poll every 10 seconds
    intervalRef.current = setInterval(pollForUpdates, 10000);

    return () => {
      isSubscribed = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [orderId, order, toast, supabaseClient]);

  // Initialize timestamp after mount to avoid hydration issues
  useEffect(() => {
    setLastUpdate(Date.now());
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOrder();
  }, [orderId, fetchOrder]);

  // Estimate completion time based on status
  useEffect(() => {
    if (!order) return;

    const baseTime = new Date(order.created_at).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - baseTime) / 1000 / 60); // minutes

    switch (order.status) {
      case 'created':
        setEstimatedTime(null);
        break;
      case 'paid':
        setEstimatedTime(15); // 15 minutes from payment
        break;
      // No accepted status in simplified flow
      case 'in_prep':
        setEstimatedTime(8); // 8 minutes from prep start
        break;
      case 'ready':
        setEstimatedTime(0); // Ready now
        break;
      case 'served':
        setEstimatedTime(null);
        break;
      default:
        setEstimatedTime(null);
    }
  }, [order]);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusMessage = (status: OrderStatus): string => {
    const messages = {
      created: "Your order is being processed...",
      paid: "Payment confirmed! Your order is being prepared.",
      in_prep: "Your order is being prepared with care.",
      ready: "Your order is ready for pickup!",
      served: "Order completed. Thank you!"
    };
    return messages[status] || "Order status unknown";
  };

  const getStatusDisplayText = (status: OrderStatus): string => {
    const displayTexts = {
      created: "Order Placed",
      paid: "Payment Confirmed",
      in_prep: "Being Prepared",
      ready: "Ready for Pickup",
      served: "Completed"
    };
    return displayTexts[status] || status;
  };

  const stepperSteps = [
    { key: 'paid', label: 'Paid', icon: CreditCard },
    { key: 'in_prep', label: 'Preparing', icon: ChefHat },
    { key: 'ready', label: 'Ready', icon: Bell },
    { key: 'served', label: 'Complete', icon: Utensils }
  ];

  const getStepStatus = (stepKey: string, currentStatus: OrderStatus): 'completed' | 'current' | 'pending' => {
    const statusOrder = ['created', 'paid', 'in_prep', 'ready', 'served'];
    const stepOrder = ['paid', 'in_prep', 'ready', 'served'];
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = stepOrder.indexOf(stepKey);
    
    if (stepIndex < currentIndex - 1) return 'completed';
    if (stepIndex === currentIndex - 1) return 'current';
    return 'pending';
  };

  if (loading) {
    return <OrderLoadingSpinner />;
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Alert className="max-w-md">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {error || 'Order not found'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const progress = (() => {
    const statusOrder = ['created', 'paid', 'in_prep', 'ready', 'served'];
    const currentIndex = statusOrder.indexOf(order.status);
    return Math.max(0, (currentIndex / (statusOrder.length - 1)) * 100);
  })();

  return (
    <main className="mx-auto max-w-[480px] min-h-[100dvh]">
      <div className="sticky top-0 z-30 pt-safe">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold mt-2">Order #{order.id.slice(-6)}</h1>
            <p className="text-muted-foreground">{order.venues[0]?.name}</p>
          </div>
        </div>
      </div>

      {/* Make only this the vertical scroller */}
      <div id="order-scroll-area" className="px-4 pb-safe touch-scroll">
        <div className="container mx-auto">
          <div className="space-y-6 pb-6">
        {/* Payment Status Alerts */}
        {getPaymentStatus(order.status, order.payment_intent) === 'pending' && (
          <Alert className="bg-blue-50 border-blue-200">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Confirming payment… this can take a few seconds.</AlertDescription>
          </Alert>
        )}

        {/* No failed status in simplified flow */}

        {/* Status Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="space-y-2">
            <Badge 
              className={`px-4 py-2 text-sm font-medium ${getStatusColor(order.status)}`}
            >
              {getStatusDisplayText(order.status)}
            </Badge>
            
            <p className="text-muted-foreground">
              {getStatusMessage(order.status)}
            </p>
          </div>

          {estimatedTime !== null && estimatedTime > 0 && (
            <div className="flex items-center justify-center space-x-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Estimated time: {estimatedTime} minutes</span>
            </div>
          )}

          {order.status === 'ready' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-center space-x-2 text-green-800">
                <Bell className="h-5 w-5" />
                <span className="font-medium">Your order is ready!</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-muted-foreground text-center">
            Order Progress
          </div>
        </div>

        {/* Status Stepper */}
        {order.status !== 'created' && (
          <div className="relative">
            <div className="flex justify-between items-center">
              {stepperSteps.map((step, index) => {
                const status = getStepStatus(step.key, order.status);
                const Icon = step.icon;
                
                return (
                  <div key={step.key} className="flex flex-col items-center space-y-2 relative">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                      ${status === 'completed' ? 'bg-primary border-primary text-primary-foreground' : 
                        status === 'current' ? 'bg-primary/10 border-primary text-primary' : 
                        'bg-muted border-muted-foreground/20 text-muted-foreground'}
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    <span className={`text-xs font-medium ${
                      status === 'completed' || status === 'current' ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </span>
                    
                    {/* Connection line */}
                    {index < stepperSteps.length - 1 && (
                      <div className="absolute left-12 top-6 h-0.5 bg-muted-foreground/20 hidden sm:block"
                           style={{ width: 'calc(100vw / 5 - 3rem)' }}>
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: '0%' }}
                          animate={{ 
                            width: order && stepperSteps[index + 1] && getStepStatus(stepperSteps[index + 1]!.key, order.status) === 'completed' ? '100%' : '0%'
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order Details</span>
              {order.sessions[0]?.tables[0]?.label && (
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  {order.sessions[0].tables[0].label}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Items */}
            <div className="space-y-3">
              {order.order_items.map((item, index) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                    <span className="font-medium">{item.items[0]?.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.quantity}x
                      </Badge>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                  <span className="font-medium">
                    {formatPrice(item.unit_price_cents * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal_cents)}</span>
              </div>
              {order.tax_cents > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatPrice(order.tax_cents)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(order.total_cents)}</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground pt-2">
              Order placed: {new Date(order.created_at).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Success Animation */}
        <AnimatePresence>
          {justPaid && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
            >
              <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className="bg-green-500 text-white p-8 rounded-lg text-center"
              >
                <CheckCircle className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Payment Confirmed!</h3>
                <p>Your order is being prepared</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
