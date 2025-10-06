import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Award, Medal, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SellerBadgeProps {
  level: 'bronze' | 'silver' | 'gold' | 'verified';
  verified?: boolean;
  totalSales?: number;
  className?: string;
  showLabel?: boolean;
}

export const SellerBadge: React.FC<SellerBadgeProps> = ({ 
  level, 
  verified = false, 
  totalSales = 0,
  className,
  showLabel = true 
}) => {
  const badges = {
    bronze: {
      icon: Medal,
      label: 'Bronze',
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300',
      iconColor: 'text-orange-600'
    },
    silver: {
      icon: Award,
      label: 'Argent',
      color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border-slate-300',
      iconColor: 'text-slate-600'
    },
    gold: {
      icon: Star,
      label: 'Or',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300',
      iconColor: 'text-yellow-600'
    },
    verified: {
      icon: Shield,
      label: 'Vérifié',
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300',
      iconColor: 'text-green-600'
    }
  };

  const currentBadge = verified ? badges.verified : badges[level];
  const Icon = currentBadge.icon;

  return (
    <Badge 
      className={cn(
        'flex items-center gap-1.5 border',
        currentBadge.color,
        className
      )}
      title={`Vendeur ${currentBadge.label}${totalSales > 0 ? ` - ${totalSales} ventes` : ''}`}
    >
      <Icon className={cn('h-3.5 w-3.5', currentBadge.iconColor)} />
      {showLabel && <span className="font-medium">{currentBadge.label}</span>}
    </Badge>
  );
};
