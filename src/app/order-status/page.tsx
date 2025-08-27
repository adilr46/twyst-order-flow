"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle, ChefHat, Loader2, CreditCard, Users, Utensils, Bell, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { getStatusDescription, getStatusColor, type OrderStatus } from '@/utils/orderTransitions';
// import HeaderShell from '@/components/layout/HeaderShell';

interface OrderData {
  id: string;
  status: OrderStatus;
  total_cents: number;
  subtotal_cents: number;
  tax_cents: number;
  created_at: string;
  venues: {
    name: string;
    slug: string;
  };
  order_items: Array<{
    id: string;
    qty: number;
    unit_price_cents: number;
    notes?: string;
    items: {
      name: string;
      description?: string;
    };
  }>;
  sessions: {
    tables: {
      label: string;
    };
  };
}

interface OrderStatusProps {
  venueSlug: string;
}

export default function OrderStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams?.get('orderId');
  const { toast } = useToast();
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justPaid, setJustPaid] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch order data
  const fetchOrder = async () => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
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
            qty,
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

      // Ensure status is not null before setting the order
      if (data.status) {
        setOrder(data as OrderData);
      } else {
        setError('Order status is invalid');
      }
    } catch (err: any) {
      console.error('Failed to fetch order:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription for order updates
  useEffect(() => {
    if (!orderId || !order) return;

    const subscription = supabase
      .channel('order-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        console.log('Order updated:', payload);
        const newStatus = payload.new.status;
        if (newStatus !== order.status) {
          setOrder(prev => prev ? { ...prev, status: newStatus } : null);
          setLastUpdate(Date.now());
          
          // Show toast notification for status changes
          toast({
            title: "Order Updated",
            description: getStatusDescription(newStatus),
          });

          // Trigger success animation for paid status
          if (newStatus === 'paid' && order.status !== 'paid') {
            setJustPaid(true);
            setTimeout(() => setJustPaid(false), 2000);
          }
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [orderId, order, toast]);

  // Polling fallback for status updates
  useEffect(() => {
    if (!orderId || !order) return;

    let isSubscribed = true;

    const pollForUpdates = async () => {
      try {
        const { data } = await supabase
          .from('orders')
          .select('status')
          .eq('id', orderId)
          .single();
        
        if (data && data.status && data.status !== order.status && isSubscribed) {
          const prevStatus = order.status;
          setOrder(prev => prev ? { ...prev, status: data.status as OrderStatus } : null);
          
          // Trigger success animation for paid status
          if (data.status === 'paid' && prevStatus !== 'paid') {
            setJustPaid(true);
            setTimeout(() => setJustPaid(false), 2000);
          }
          
          toast({
            title: "Order Updated",
            description: getStatusDescription(data.status as OrderStatus),
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
  }, [orderId, order, toast]);

  // Initialize timestamp after mount to avoid hydration issues
  useEffect(() => {
    setLastUpdate(Date.now());
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOrder();
  }, [orderId]);

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
      case 'accepted':
        setEstimatedTime(12); // 12 minutes from acceptance
        break;
      case 'in_prep':
        setEstimatedTime(8); // 8 minutes from prep start
        break;
      case 'ready':
        setEstimatedTime(0); // Ready now
        break;
      case 'served':
      case 'cancelled':
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
      accepted: "Order accepted by the kitchen!",
      in_prep: "Your order is being prepared with care.",
      ready: "Your order is ready for pickup!",
      served: "Order completed. Thank you!",
      cancelled: "This order has been cancelled."
    };
    return messages[status] || "Order status unknown";
  };

  const getStatusDisplayText = (status: OrderStatus): string => {
    const displayTexts = {
      created: "Order Placed",
      paid: "Payment Confirmed",
      accepted: "Order Accepted", 
      in_prep: "Being Prepared",
      ready: "Ready for Pickup",
      served: "Completed",
      cancelled: "Cancelled"
    };
    return displayTexts[status] || status;
  };

  const stepperSteps = [
    { key: 'paid', label: 'Paid', icon: CreditCard },
    { key: 'accepted', label: 'Accepted', icon: CheckCircle },
    { key: 'in_prep', label: 'Preparing', icon: ChefHat },
    { key: 'ready', label: 'Ready', icon: Bell },
    { key: 'served', label: 'Complete', icon: Utensils }
  ];

  const getStepStatus = (stepKey: string, currentStatus: OrderStatus): 'completed' | 'current' | 'pending' => {
    const statusOrder = ['created', 'paid', 'accepted', 'in_prep', 'ready', 'served'];
    const stepOrder = ['paid', 'accepted', 'in_prep', 'ready', 'served'];
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = stepOrder.indexOf(stepKey);
    
    if (stepIndex < currentIndex - 1) return 'completed';
    if (stepIndex === currentIndex - 1) return 'current';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading your order...</p>
          </div>
        </div>
      </div>
    );
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
    const statusOrder = ['created', 'paid', 'accepted', 'in_prep', 'ready', 'served'];
    const currentIndex = statusOrder.indexOf(order.status);
    return Math.max(0, (currentIndex / (statusOrder.length - 1)) * 100);
  })();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold mt-2">Order #{order.id.slice(-6)}</h1>
        <p className="text-muted-foreground">{order.venues.name}</p>
      </div>
      <div className="space-y-6 pb-6">
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
        {order.status !== 'cancelled' && (
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
              {order.sessions?.tables?.label && (
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  {order.sessions.tables.label}
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
                      <span className="font-medium">{item.items.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.qty}x
                      </Badge>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                  <span className="font-medium">
                    {formatPrice(item.unit_price_cents * item.qty)}
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
  );
}
