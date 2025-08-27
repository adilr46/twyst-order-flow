"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChefHat, Bell, RefreshCw, AlertTriangle, LogOut, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVenue } from '@/hooks/useVenue';
import { useOrders, type FOHOrder } from '@/hooks/useOrders';
import { type OrderStatus } from '@/lib/data-layer';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/auth/LoginForm';
import OrderItemsPopover from '@/components/foh/OrderItemsPopover';

interface FOHOrderBoardProps {
  venueSlug: string;
}

const FOHOrderBoard: React.FC<FOHOrderBoardProps> = ({ venueSlug }) => {
  const { toast } = useToast();
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const { venue, loading: loadingVenue, error: venueError } = useVenue(venueSlug);
  
  // Enhanced orders hook with connection monitoring
  const { 
    orders, 
    loading, 
    error, 
    refresh, 
    setStatus, 
    isConnected, 
    lastEventTime 
  } = useOrders(venue?.id, { 
    subscribe: true,
    onConnectionChange: (state) => {
      // Show reconnected toast when connection is restored
      if (!isConnected && state.isConnected) {
        toast({
          title: "Reconnected",
          description: "Real-time updates resumed",
          duration: 3000,
        });
      }
    }
  });
  
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'time' | 'table' | 'status'>('time');
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await setStatus(orderId, newStatus);
      toast({
        title: "Order updated",
        description: `Order ${orderId.slice(0, 8)} marked as ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error updating order",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const firstRelevantOrder = orders.find(order => {
        switch (e.key.toLowerCase()) {
          case 'a': return order.status === 'paid';
          case 'p': return order.status === 'accepted';
          case 'r': return order.status === 'in_prep';
          case 's': return order.status === 'served';
          default: return false;
        }
      });

      if (firstRelevantOrder) {
        const nextStatus: OrderStatus = 
          e.key.toLowerCase() === 'a' ? 'accepted' :
          e.key.toLowerCase() === 'p' ? 'in_prep' :
          e.key.toLowerCase() === 'r' ? 'served' :
          'served';
        
        handleStatusUpdate(firstRelevantOrder.id, nextStatus);
      }

      // Manual refresh with F5 or Ctrl+R
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        refresh();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [orders, handleStatusUpdate, refresh]);

  // Connection monitoring is now handled by useOrders hook

  const handleLogout = async () => {
    await signOut();
    setLoginSuccess(false);
  };

  // Show login form if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !loginSuccess) {
    return <LoginForm />;
  }

  if (loadingVenue) return <div className="p-4">Loading venue…</div>;
  if (venueError || !venue) return <div className="p-4 text-red-600">Venue not found for "{venueSlug}".</div>;

  // Filter orders to only show relevant statuses for FOH (status >= paid)
  const filteredOrders = orders.filter(order => {
    const relevantStatuses: OrderStatus[] = ['paid', 'accepted', 'in_prep', 'served']; // No 'created' - FOH only sees paid+ orders
    const matchesRelevantStatus = relevantStatuses.includes(order.status);
    const matchesFilter = selectedFilter === 'all' || order.status === selectedFilter;
    return matchesRelevantStatus && matchesFilter;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'table':
        return (a.table_label || '').localeCompare(b.table_label || '');
      case 'status':
        const statusOrder = { created: 0, paid: 1, accepted: 2, in_prep: 3, ready: 4, served: 5, cancelled: 6 };
        return statusOrder[a.status] - statusOrder[b.status];
      case 'time':
      default:
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
  });

  const getOrderAge = (timestamp: string): string => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    return `${diffMins} mins ago`;
  };

  const isOrderUrgent = (order: FOHOrder): boolean => {
    const ageMinutes = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60);
    return ageMinutes > 30 && (order.status === 'paid' || order.status === 'accepted' || order.status === 'in_prep');
  };

  const getStatusCounts = () => {
    const relevantOrders = orders.filter(o => ['paid', 'accepted', 'in_prep', 'ready'].includes(o.status));
    return {
      paid: relevantOrders.filter(o => o.status === 'paid').length,
      accepted: relevantOrders.filter(o => o.status === 'accepted').length,
      in_prep: relevantOrders.filter(o => o.status === 'in_prep').length,
      ready: relevantOrders.filter(o => o.status === 'served').length,
      all: relevantOrders.length
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{venue.name} — FOH</h1>
              <p className="text-muted-foreground">Live Kitchen Display</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {/* Connection Status */}
                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted/50">
                  {isConnected ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-xs font-medium">
                    {isConnected ? 'Live' : 'Reconnecting...'}
                  </span>
                </div>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Sort by Time</SelectItem>
                    <SelectItem value="table">Sort by Table</SelectItem>
                    <SelectItem value="status">Sort by Status</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    refresh();
                  }}
                  className="animate-bounce-scale"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {loading && <div className="text-sm text-muted-foreground mb-4">Loading orders…</div>}
        {!!error && <div className="text-sm text-red-600 mb-4">Couldn't load or update orders.</div>}

        <div className="mb-6 space-y-4">
          {/* Keyboard shortcuts help */}
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Keyboard shortcuts:</span>{' '}
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">A</kbd> Accept • {' '}
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">P</kbd> In-Prep • {' '}
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">R</kbd> Ready • {' '}
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">S</kbd> Served • {' '}
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">F5</kbd> Refresh
            </p>
          </div>

          <Tabs value={selectedFilter} onValueChange={(value: any) => setSelectedFilter(value)}>
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="all" className="relative">
                All Orders
                <Badge variant="secondary" className="ml-2">
                  {statusCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="paid" className="relative">
                <Clock className="h-4 w-4 mr-2" />
                Paid
                <Badge variant="secondary" className="ml-2">
                  {statusCounts.paid}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="accepted" className="relative">
                <ChefHat className="h-4 w-4 mr-2" />
                Accepted
                <Badge variant="secondary" className="ml-2">
                  {statusCounts.accepted}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="in_prep" className="relative">
                <ChefHat className="h-4 w-4 mr-2" />
                In Prep
                <Badge variant="secondary" className="ml-2">
                  {statusCounts.in_prep}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="ready" className="relative">
                <Bell className="h-4 w-4 mr-2" />
                Ready
                <Badge variant="secondary" className="ml-2">
                  {statusCounts.ready}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedFilter} className="space-y-4">
              <AnimatePresence>
                <div className="order-board-grid">
                  {sortedOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Card className={`order-card ${isOrderUrgent(order) ? 'urgent' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-bold">
                            {order.table_label ? `Table ${order.table_label}` : "Table ?"}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {isOrderUrgent(order) && (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                            <Badge variant="secondary" className="font-medium">{order.status}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Order #{order.id.slice(0, 8)}</span>
                          <span>{getOrderAge(order.created_at)}</span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Items</span>
                            <OrderItemsPopover />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="font-semibold text-primary">
                            £{(order.total_cents / 100).toFixed(2)}
                          </span>
                          
                          <div className="flex gap-1">
                            {order.status === 'paid' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(order.id, 'accepted')}
                                className="text-xs rounded bg-primary text-primary-foreground px-3 py-1"
                              >
                                Accept <kbd className="ml-1 text-xs">A</kbd>
                              </Button>
                            )}
                            {order.status === 'accepted' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(order.id, 'in_prep')}
                                className="text-xs rounded"
                                variant="outline"
                              >
                                In‑Prep <kbd className="ml-1 text-xs">P</kbd>
                              </Button>
                            )}
                            {order.status === 'in_prep' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(order.id, 'served')}
                                className="text-xs rounded"
                                variant="outline"
                              >
                                Ready <kbd className="ml-1 text-xs">R</kbd>
                              </Button>
                            )}
                            {order.status === 'served' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(order.id, 'served')}
                                className="text-xs rounded bg-green-600 text-white px-3 py-1"
                              >
                                Served <kbd className="ml-1 text-xs">S</kbd>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  ))}
                </div>
              </AnimatePresence>

              {sortedOrders.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    No orders in this category
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default FOHOrderBoard;