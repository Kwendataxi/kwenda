import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UnifiedActivityItem } from '@/hooks/useUnifiedActivityRobust';
import { Car, Package, ShoppingBag, CreditCard, Truck, MapPin, Clock, CheckCircle2, AlertCircle, XCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ModernActivityItemProps {
  item: UnifiedActivityItem;
  onClick?: (item: UnifiedActivityItem) => void;
}

export const ModernActivityItem = ({ item, onClick }: ModernActivityItemProps) => {
  // Cas spécial pour les transferts
  if (item.type === 'wallet_transfer') {
    const isReceived = item.title.includes('Reçu');
    
    return (
      <motion.div
        whileHover={{ scale: 1.02, x: 5 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card 
          onClick={() => onClick?.(item)}
          className="cursor-pointer border-none shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-card to-card/95"
        >
          <CardContent className="p-4 flex items-center gap-4">
            {/* Avatar avec gradient moderne */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
              isReceived 
                ? 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600' 
                : 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600'
            }`}>
              {isReceived ? (
                <ArrowDownLeft className="h-6 w-6 text-white" />
              ) : (
                <ArrowUpRight className="h-6 w-6 text-white" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground mb-1 truncate">
                {item.counterpartyName || 'Contact'}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{isReceived ? 'Transfert reçu' : 'Transfert envoyé'}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: fr })}</span>
              </div>
            </div>

            {/* Montant */}
            <div className="text-right">
              <div className={`text-lg font-bold ${
                isReceived ? 'text-emerald-600' : 'text-blue-600'
              }`}>
                {isReceived ? '+' : '-'}{item.amount?.toLocaleString()} {item.currency}
              </div>
              <Badge 
                variant={isReceived ? 'default' : 'secondary'}
                className={`text-xs ${
                  isReceived 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {item.subtitle}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const getIcon = () => {
    switch (item.type) {
      case 'transport':
        return Car;
      case 'delivery':
        return Package;
      case 'marketplace_purchase':
      case 'marketplace_sale':
        return ShoppingBag;
      case 'payment':
        return CreditCard;
      default:
        return Clock;
    }
  };

  const getIconBg = () => {
    switch (item.type) {
      case 'transport':
        return 'bg-gradient-to-br from-blue-500 to-blue-600';
      case 'delivery':
        return 'bg-gradient-to-br from-emerald-500 to-emerald-600';
      case 'marketplace_purchase':
        return 'bg-gradient-to-br from-purple-500 to-purple-600';
      case 'marketplace_sale':
        return 'bg-gradient-to-br from-orange-500 to-orange-600';
      case 'payment':
        return 'bg-gradient-to-br from-pink-500 to-pink-600';
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-600';
    }
  };

  const getStatusIcon = () => {
    if (!item.status) return null;
    
    const status = item.status.toLowerCase();
    if (['completed', 'delivered', 'finished', 'success'].includes(status)) {
      return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
    }
    if (['pending', 'confirmed', 'processing'].includes(status)) {
      return <Clock className="h-3 w-3 text-orange-500" />;
    }
    if (['cancelled', 'failed', 'rejected'].includes(status)) {
      return <XCircle className="h-3 w-3 text-red-500" />;
    }
    return <AlertCircle className="h-3 w-3 text-blue-500" />;
  };

  const getStatusColor = () => {
    if (!item.status) return 'bg-gray-100 text-gray-600';
    
    const status = item.status.toLowerCase();
    if (['completed', 'delivered', 'finished', 'success'].includes(status)) {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
    if (['pending', 'confirmed', 'processing'].includes(status)) {
      return 'bg-orange-100 text-orange-700 border-orange-200';
    }
    if (['cancelled', 'failed', 'rejected'].includes(status)) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const mins = Math.floor(diffInHours * 60);
      return `Il y a ${mins} min`;
    }
    if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    }
    if (diffInHours < 48) {
      return 'Hier';
    }
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toLocaleString();
  };

  const IconComponent = getIcon();

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <Card 
        className="group cursor-pointer overflow-hidden bg-gradient-to-r from-card via-card to-card/95 border border-border/50 hover:border-border hover:shadow-lg transition-all duration-200"
        onClick={() => onClick?.(item)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Icône avec gradient */}
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center shadow-sm
              ${getIconBg()}
              group-hover:shadow-md transition-shadow duration-200
            `}>
              <IconComponent className="h-6 w-6 text-white" />
            </div>

            {/* Contenu principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {item.subtitle}
                    </p>
                  )}
                </div>

                {/* Montant */}
                {item.amount && (
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-card-foreground">
                      {formatAmount(item.amount, item.currency || 'CDF')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.currency || 'CDF'}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer avec status et timestamp */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  {item.status && (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs px-2 py-1 border ${getStatusColor()}`}
                    >
                      <div className="flex items-center gap-1">
                        {getStatusIcon()}
                        {item.status}
                      </div>
                    </Badge>
                  )}
                </div>

                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                  {formatTimestamp(item.timestamp)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};