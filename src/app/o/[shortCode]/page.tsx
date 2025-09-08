"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, Clock, Utensils, Truck } from 'lucide-react';
import OrderLoadingSpinner from '@/components/ui/OrderLoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/format';
import { supabase } from '@/lib/supabase';

const statusConfig = {
  created: { label: 'Created', icon: Clock, color: 'bg-gray-400' },
  paid: { label: 'Paid', icon: CheckCircle, color: 'bg-[#1e3a8a]' },
  in_prep: { label: 'In Prep', icon: Utensils, color: 'bg-[#1e3a8a]' },
  ready: { label: 'Ready', icon: '🕒', color: 'bg-[#1e3a8a]' },
  served: { label: 'Served', icon: CheckCircle, color: 'bg-[#1e3a8a]' },
};

export default function OrderStatusPage() {
  const params = useParams();
  const shortCode = params?.shortCode as string;
  
  const [order, setOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shortCode) return;

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${shortCode}`);
        if (!response.ok) {
          setError('Order not found');
          setLoading(false);
          return;
        }

        const orderData = await response.json();
        setOrder(orderData);
        setOrderItems(orderData.items || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError('Failed to load order');
        setLoading(false);
      }
    };

    fetchOrder();
  }, [shortCode]);

  useEffect(() => {
    if (!order?.id) return;

    // Subscribe to real-time updates on orders table filtered by order_id
    let channel: any;
    
    channel = supabase
      .channel(`order-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          console.log('[realtime] Order updated:', payload.new);
          setOrder(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
          filter: `order_id=eq.${order.id}`,
        },
        async (payload) => {
          console.log('[realtime] Order items changed:', payload);
          // Refresh order items when they change
          try {
            const response = await fetch(`/api/orders/${shortCode}`);
            if (response.ok) {
              const orderData = await response.json();
              setOrderItems(orderData.items || []);
            }
          } catch (err) {
            console.error('Failed to refresh order items:', err);
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [order?.id, shortCode]);

  if (loading) {
    return <OrderLoadingSpinner />;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">{error || 'Order not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatus = statusConfig[order.status as keyof typeof statusConfig];
  const StatusIcon = currentStatus?.icon || Clock;

  // Calculate total from order items (what customer actually paid for)
  const itemsTotal = orderItems.reduce((sum, item) => sum + (item.price_cents * item.qty), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Order Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  Order #{order.short_code}
                </CardTitle>
                <p className="text-gray-500 mt-1">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <Badge className={`${currentStatus?.color || 'bg-gray-400'} text-white px-4 py-2`}>
                {currentStatus?.label || 'Unknown'}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Status Timeline */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Order Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(statusConfig).map(([status, config], index) => {
                const Icon = config.icon;
                const isCompleted = getStatusOrder(order.status) >= getStatusOrder(status);
                const isCurrent = order.status === status;
                const isEmoji = typeof Icon === 'string';
                
                return (
                  <div key={status} className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ease-in-out flex-shrink-0 ${
                      isCompleted ? 'bg-[#1e3a8a]' : 'bg-gray-200'
                    }`}>
                      {isEmoji ? (
                        <span className={`text-2xl ${isCompleted ? 'filter brightness-0 invert' : 'opacity-50'}`}>
                          {Icon}
                        </span>
                      ) : (
                        <Icon className={`w-6 h-6 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        isCurrent ? 'text-[#1e3a8a]' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {config.label}
                      </p>
                    </div>
                    {index < Object.keys(statusConfig).length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200">
                        <div className={`w-full h-full transition-all duration-200 ease-in-out ${
                          isCompleted ? 'bg-[#1e3a8a]' : 'bg-gray-200'
                        }`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1 pr-3">
                    <h4 className="font-semibold text-gray-900">
                      {item.item_description || item.menuItem?.name || 'Unknown Item'}
                    </h4>
                    {item.menuItem?.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.menuItem.description}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      {formatMoney(item.price_cents)} × {item.qty}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatMoney(item.price_cents * item.qty)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-[#1e3a8a]">{formatMoney(itemsTotal)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getStatusOrder(status: string): number {
  const order = ['created', 'paid', 'in_prep', 'ready', 'served'];
  return order.indexOf(status);
}
