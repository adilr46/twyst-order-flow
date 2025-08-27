import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, ChefHat, CheckCircle, XCircle } from 'lucide-react';
import { OrderStatus as OrderStatusType } from '@/types';

interface StatusBadgeProps {
  status: OrderStatusType;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = (status: OrderStatusType) => {
    switch (status) {
      case 'created':
        return {
          label: 'Created',
          icon: Clock,
          className: 'status-pending'
        };
      case 'paid':
        return {
          label: 'Paid',
          icon: CheckCircle,
          className: 'status-paid'
        };
      case 'accepted':
        return {
          label: 'Accepted',
          icon: CheckCircle,
          className: 'status-accepted'
        };
      case 'in_prep':
        return {
          label: 'In Prep',
          icon: ChefHat,
          className: 'status-preparing'
        };
      case 'served':
        return {
          label: 'Served',
          icon: CheckCircle,
          className: 'status-completed'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: XCircle,
          className: 'bg-destructive text-destructive-foreground'
        };
      default:
        return {
          label: 'Unknown',
          icon: Clock,
          className: 'bg-muted text-muted-foreground'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge 
      className={`${config.className} ${className} flex items-center gap-1 font-medium`}
      variant="secondary"
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};