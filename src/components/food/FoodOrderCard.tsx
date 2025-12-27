import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Phone, PackageCheck, XCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { FoodOrder, FoodOrderStatus } from '@/hooks/useFoodClientOrders';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FoodOrderCardProps {
  order: FoodOrder;
  onCancel?: (orderId: string, reason: string) => void;
  isCancelling?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-500', icon: '⏳' },
  confirmed: { label: 'Confirmée', color: 'bg-blue-500', icon: '✅' },
  preparing: { label: 'En préparation', color: 'bg-orange-500', icon: '👨‍🍳' },
  ready: { label: 'Prête', color: 'bg-green-400', icon: '✨' },
  delivering: { label: 'En livraison', color: 'bg-purple-500', icon: '🚚' },
  delivered: { label: 'Livrée', color: 'bg-green-600', icon: '🎉' },
  cancelled: { label: 'Annulée', color: 'bg-red-500', icon: '❌' },
};

// Fallback config for unknown statuses
const DEFAULT_STATUS = { label: 'Inconnu', color: 'bg-gray-500', icon: '❓' };

export const FoodOrderCard = ({ order, onCancel, isCancelling }: FoodOrderCardProps) => {
  const navigate = useNavigate();
  const statusConfig = STATUS_CONFIG[order.status] || DEFAULT_STATUS;
  const canCancel = ['pending', 'confirmed'].includes(order.status);
  const isActiveOrder = ['confirmed', 'preparing', 'ready', 'delivering'].includes(order.status);

  const formatPrice = (price: number) => formatCurrency(price, 'CDF');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-2 border-border/50 dark:border-border/80 hover:border-border transition-all bg-card dark:bg-card/98 shadow-lg dark:shadow-2xl dark:shadow-primary/10 hover:shadow-xl dark:hover:shadow-primary/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 p-4 border-b-2 border-border/50 dark:border-border/80">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {order.restaurant_logo && (
                <img
                  src={order.restaurant_logo}
                  alt={order.restaurant_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-background"
                />
              )}
              <div>
                <h3 className="font-bold text-foreground">{order.restaurant_name}</h3>
                <p className="text-sm text-muted-foreground">
                  Commande #{order.order_number}
                </p>
              </div>
            </div>
            
            <Badge className={`${statusConfig.color} dark:${statusConfig.color} text-white shadow-md font-semibold px-3 py-1`}>
              {statusConfig.icon} {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Items */}
        <div className="p-4 space-y-2 bg-card">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
            <PackageCheck className="w-4 h-4" />
            Articles commandés
          </div>
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-3">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Qté: {item.quantity}</p>
                </div>
              </div>
              <p className="font-semibold text-primary">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        {/* Driver contact - only when delivering */}
        {order.status === 'delivering' && order.driver_id && (
          <div className="p-4 bg-primary/10 dark:bg-primary/20 border-y border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {order.driver_photo ? (
                  <img 
                    src={order.driver_photo} 
                    alt={order.driver_name || 'Livreur'}
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">
                    🚴 {order.driver_name || 'Votre livreur'}
                  </p>
                  <p className="text-sm text-muted-foreground">En route vers vous</p>
                </div>
              </div>
              {order.driver_phone && (
                <Button 
                  variant="default" 
                  size="sm"
                  className="shadow-md"
                  onClick={() => window.open(`tel:${order.driver_phone}`, '_self')}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Appeler
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Delivery Info */}
        <div className="p-4 bg-muted/30 dark:bg-muted/50 space-y-2 text-sm">
          <div className="flex items-start gap-2 text-muted-foreground dark:text-muted-foreground/90">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="flex-1">{order.delivery_address}</p>
          </div>
          
          {/* Restaurant phone */}
          {order.restaurant_phone && (
            <a 
              href={`tel:${order.restaurant_phone}`}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <Phone className="w-4 h-4" />
              <span>📍 Restaurant : {order.restaurant_phone}</span>
            </a>
          )}
          
          {/* Client delivery phone */}
          <div className="flex items-center gap-2 text-muted-foreground dark:text-muted-foreground/90">
            <Phone className="w-4 h-4" />
            <p>🚚 Livraison : {order.delivery_phone}</p>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground dark:text-muted-foreground/90">
            <Clock className="w-4 h-4" />
            <p>{format(new Date(order.created_at), 'PPp', { locale: fr })}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-card dark:bg-card/95 border-t-2 border-border/50 dark:border-border/80">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-primary dark:text-primary-glow">
                {formatPrice(order.total_amount + order.delivery_fee)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isActiveOrder && (
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => navigate(`/unified-tracking/food/${order.id}`)}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Suivre
              </Button>
            )}
            
            {canCancel && onCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    disabled={isCancelling}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Annuler
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Annuler la commande ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Garder</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onCancel(order.id, 'Annulé par le client')}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Confirmer l'annulation
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
