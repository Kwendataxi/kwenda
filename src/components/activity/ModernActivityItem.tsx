import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UnifiedActivityItem } from '@/hooks/useUnifiedActivityRobust';
import { Car, Package, ShoppingBag, CreditCard, Clock, ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ModernActivityItemProps {
  item: UnifiedActivityItem;
  onClick?: (item: UnifiedActivityItem) => void;
}

export const ModernActivityItem = ({ item, onClick }: ModernActivityItemProps) => {
  // Configuration des styles par type - palette pastel soft
  const getTypeConfig = () => {
    switch (item.type) {
      case 'transport':
        return { 
          icon: Car, 
          bg: 'bg-blue-50 dark:bg-blue-950/30', 
          iconColor: 'text-blue-500',
          label: 'Transport'
        };
      case 'delivery':
        return { 
          icon: Package, 
          bg: 'bg-emerald-50 dark:bg-emerald-950/30', 
          iconColor: 'text-emerald-500',
          label: 'Livraison'
        };
      case 'marketplace_purchase':
        return { 
          icon: ShoppingBag, 
          bg: 'bg-violet-50 dark:bg-violet-950/30', 
          iconColor: 'text-violet-500',
          label: 'Achat'
        };
      case 'marketplace_sale':
        return { 
          icon: ShoppingBag, 
          bg: 'bg-amber-50 dark:bg-amber-950/30', 
          iconColor: 'text-amber-500',
          label: 'Vente'
        };
      case 'payment':
        return { 
          icon: CreditCard, 
          bg: 'bg-rose-50 dark:bg-rose-950/30', 
          iconColor: 'text-rose-500',
          label: 'Paiement'
        };
      case 'wallet_transfer':
        const isReceived = item.title.includes('Reçu');
        return { 
          icon: isReceived ? ArrowDownLeft : ArrowUpRight, 
          bg: isReceived ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-blue-50 dark:bg-blue-950/30', 
          iconColor: isReceived ? 'text-emerald-500' : 'text-blue-500',
          label: isReceived ? 'Reçu' : 'Envoyé'
        };
      default:
        return { 
          icon: Clock, 
          bg: 'bg-muted/50', 
          iconColor: 'text-muted-foreground',
          label: 'Activité'
        };
    }
  };

  const getStatusConfig = () => {
    if (!item.status) return null;
    
    const status = item.status.toLowerCase();
    if (['completed', 'delivered', 'finished', 'success'].includes(status)) {
      return { color: 'bg-emerald-500', text: 'Terminé' };
    }
    if (['pending', 'confirmed', 'processing', 'in_progress'].includes(status)) {
      return { color: 'bg-amber-500', text: 'En cours' };
    }
    if (['cancelled', 'failed', 'rejected'].includes(status)) {
      return { color: 'bg-red-500', text: 'Annulé' };
    }
    return { color: 'bg-blue-500', text: item.status };
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const mins = Math.floor(diffInHours * 60);
      return `${mins}min`;
    }
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    }
    if (diffInHours < 48) {
      return 'Hier';
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${Math.round(amount / 1000)}K`;
    }
    return amount.toLocaleString();
  };

  const config = getTypeConfig();
  const statusConfig = getStatusConfig();
  const IconComponent = config.icon;
  const isTransfer = item.type === 'wallet_transfer';
  const isReceived = isTransfer && item.title.includes('Reçu');

  return (
    <motion.div
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card 
        className="cursor-pointer bg-card border-border/30 shadow-sm hover:shadow-md transition-shadow duration-200"
        onClick={() => onClick?.(item)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Icône soft avec fond pastel */}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${config.bg}`}>
              <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
            </div>

            {/* Contenu principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground text-sm line-clamp-1">
                  {isTransfer ? (item.counterpartyName || 'Contact') : item.title}
                </h3>
                {/* Badge de statut minimaliste */}
                {statusConfig && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.color}`} />
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                      {statusConfig.text}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {config.label}
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(item.timestamp)}
                </span>
              </div>
            </div>

            {/* Montant et chevron */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {item.amount && (
                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    isTransfer 
                      ? isReceived ? 'text-emerald-600' : 'text-foreground'
                      : 'text-foreground'
                  }`}>
                    {isTransfer && (isReceived ? '+' : '-')}
                    {formatAmount(item.amount)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {item.currency || 'CDF'}
                  </div>
                </div>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
