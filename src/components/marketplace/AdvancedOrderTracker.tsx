import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Truck, 
  User, 
  Star,
  Phone,
  MessageCircle,
  Bell,
  ArrowLeft,
  AlertCircle,
  Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { RateOrderDialog } from './RateOrderDialog';

interface OrderStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  timestamp?: string;
  estimated?: string;
  icon: React.ComponentType<any>;
  color: string;
}

export const AdvancedOrderTracker: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders, loading, markAsPreparing, markAsReady, markAsInTransit, markAsDelivered, completeOrder } = useMarketplaceOrders();
  const { notifications, unreadCount, markAsRead } = useOrderNotifications();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [realtimeUpdates, setRealtimeUpdates] = useState<any>({});

  // Real-time order updates
  useEffect(() => {
    if (!user || orders.length === 0) return;

    const channels = orders.map(order => {
      const channel = supabase.channel(`order-${order.id}`)
        .on('broadcast', {
          event: 'order_status_updated'
        }, (payload) => {
          setRealtimeUpdates(prev => ({
            ...prev,
            [order.id]: payload.payload
          }));
        })
        .subscribe();

      return channel;
    });

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, orders]);

  const getAdvancedOrderSteps = (order: any): OrderStep[] => {
    const steps: OrderStep[] = [
      {
        id: 'pending_payment',
        title: 'Paiement en cours',
        description: 'Validation du paiement',
        completed: order.payment_status !== 'pending',
        timestamp: order.created_at,
        icon: Clock,
        color: 'bg-yellow-500'
      },
      {
        id: 'pending',
        title: 'En attente de confirmation',
        description: 'Le vendeur doit confirmer la commande',
        completed: ['confirmed', 'preparing', 'ready_for_pickup', 'in_transit', 'delivered', 'completed'].includes(order.status),
        timestamp: order.confirmed_at,
        estimated: order.confirmed_at ? undefined : 'Dans les 30 minutes',
        icon: User,
        color: 'bg-blue-500'
      },
      {
        id: 'confirmed',
        title: 'Commande confirmée',
        description: 'Le vendeur a accepté votre commande',
        completed: ['preparing', 'ready_for_pickup', 'in_transit', 'delivered', 'completed'].includes(order.status),
        timestamp: order.confirmed_at,
        icon: CheckCircle,
        color: 'bg-green-500'
      }
    ];

    if (order.delivery_method === 'delivery') {
      steps.push(
        {
          id: 'preparing',
          title: 'Préparation en cours',
          description: 'Le vendeur prépare votre commande',
          completed: ['ready_for_pickup', 'in_transit', 'delivered', 'completed'].includes(order.status),
          timestamp: order.preparing_at,
          estimated: order.preparing_at ? undefined : order.estimated_delivery_time,
          icon: Package,
          color: 'bg-purple-500'
        },
        {
          id: 'ready_for_pickup',
          title: 'Prêt pour collecte',
          description: 'Un livreur va récupérer votre commande',
          completed: ['in_transit', 'delivered', 'completed'].includes(order.status),
          timestamp: order.ready_for_pickup_at,
          icon: Clock,
          color: 'bg-orange-500'
        },
        {
          id: 'in_transit',
          title: 'En cours de livraison',
          description: 'Votre commande est en route',
          completed: ['delivered', 'completed'].includes(order.status),
          timestamp: order.in_transit_at,
          estimated: order.estimated_delivery_time,
          icon: Truck,
          color: 'bg-blue-600'
        },
        {
          id: 'delivered',
          title: 'Livraison effectuée',
          description: 'Votre commande a été livrée',
          completed: ['completed'].includes(order.status),
          timestamp: order.delivered_at,
          icon: MapPin,
          color: 'bg-green-600'
        }
      );
    } else {
      steps.push(
        {
          id: 'preparing',
          title: 'Préparation en cours',
          description: 'Le vendeur prépare votre commande',
          completed: ['ready_for_pickup', 'completed'].includes(order.status),
          timestamp: order.preparing_at,
          icon: Package,
          color: 'bg-purple-500'
        },
        {
          id: 'ready_for_pickup',
          title: 'Prêt pour collecte',
          description: 'Vous pouvez récupérer votre commande',
          completed: ['completed'].includes(order.status),
          timestamp: order.ready_for_pickup_at,
          icon: Clock,
          color: 'bg-orange-500'
        }
      );
    }

    steps.push({
      id: 'completed',
      title: 'Commande terminée',
      description: 'Transaction finalisée avec succès',
      completed: order.status === 'completed',
      timestamp: order.completed_at,
      icon: CheckCircle,
      color: 'bg-emerald-500'
    });

    return steps;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_payment: { variant: 'destructive' as const, label: 'Paiement en cours', color: 'bg-yellow-500' },
      pending: { variant: 'secondary' as const, label: 'En attente', color: 'bg-gray-500' },
      confirmed: { variant: 'default' as const, label: 'Confirmée', color: 'bg-blue-500' },
      preparing: { variant: 'secondary' as const, label: 'En préparation', color: 'bg-purple-500' },
      ready_for_pickup: { variant: 'default' as const, label: 'Prêt', color: 'bg-orange-500' },
      in_transit: { variant: 'default' as const, label: 'En livraison', color: 'bg-blue-600' },
      delivered: { variant: 'secondary' as const, label: 'Livrée', color: 'bg-green-600' },
      completed: { variant: 'secondary' as const, label: 'Terminée', color: 'bg-emerald-500' },
      cancelled: { variant: 'outline' as const, label: 'Annulée', color: 'bg-red-500' }
    };

    const config = statusConfig[status] || { variant: 'outline' as const, label: status, color: 'bg-gray-500' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleCompleteOrder = async (orderId: string) => {
    if (rating && feedback) {
      await completeOrder(orderId, rating, feedback);
      setShowRatingDialog(false);
      setRating(5);
      setFeedback('');
    }
  };

  const renderOrdersList = () => (
    <div className="space-y-4">
      {orders.map(order => {
        const realtimeData = realtimeUpdates[order.id];
        const currentStatus = realtimeData?.new_status || order.status;
        
        return (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-200" onClick={() => setSelectedOrder(order)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {order.product?.images?.[0] ? (
                        <img
                          src={order.product.images[0]}
                          alt={order.product.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      {realtimeData && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{order.product?.title || 'Produit'}</h3>
                      <p className="text-sm text-muted-foreground">
                        Commande #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm font-medium">
                        {order.total_amount.toLocaleString()} FC
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(currentStatus)}
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: fr })}
                  </span>
                  {order.estimated_delivery_time && currentStatus !== 'completed' && (
                    <div className="flex items-center gap-1 text-primary">
                      <Timer className="w-4 h-4" />
                      <span>
                        Estimé {formatDistanceToNow(new Date(order.estimated_delivery_time), { locale: fr })}
                      </span>
                    </div>
                  )}
                </div>

                {realtimeData && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <p className="text-xs text-green-700 font-medium">
                      ✨ Mise à jour en temps réel: {getStatusBadge(realtimeData.new_status)}
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );

  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    const steps = getAdvancedOrderSteps(selectedOrder);
    const currentStepIndex = steps.findIndex(step => !step.completed);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h2 className="text-lg font-semibold">
            Commande #{selectedOrder.id.slice(0, 8)}
          </h2>
        </div>

        {/* Order Status Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{selectedOrder.product?.title}</h3>
                <p className="text-muted-foreground">
                  {selectedOrder.quantity} × {selectedOrder.unit_price.toLocaleString()} FC
                </p>
              </div>
              {getStatusBadge(selectedOrder.status)}
            </div>
            
            {selectedOrder.estimated_delivery_time && selectedOrder.status !== 'completed' && (
              <div className="flex items-center gap-2 p-3 bg-background rounded-lg">
                <Timer className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Livraison estimée</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedOrder.estimated_delivery_time), 'EEEE dd MMMM à HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real-time Tracking Button */}
        {['confirmed', 'preparing', 'ready_for_pickup', 'in_transit', 'delivered'].includes(selectedOrder.status) && (
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Suivre en temps réel</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Visualisez la position de votre livreur sur la carte et recevez des mises à jour instantanées
                  </p>
                  <Button 
                    onClick={() => navigate(`/tracking/marketplace/${selectedOrder.id}`)}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <MapPin className="w-5 h-5" />
                    Ouvrir le suivi en direct
                    <span className="ml-auto">→</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Suivi détaillé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-muted" />
              
              <div className="space-y-6">
                {steps.map((step, index) => {
                  const IconComponent = step.icon;
                  const isActive = index === currentStepIndex;
                  
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative flex gap-4"
                    >
                      {/* Step Icon */}
                      <div className={`
                        relative z-10 w-12 h-12 rounded-full flex items-center justify-center
                        ${step.completed 
                          ? step.color + ' text-white' 
                          : isActive 
                            ? 'bg-primary text-primary-foreground animate-pulse'
                            : 'bg-muted text-muted-foreground'
                        }
                      `}>
                        <IconComponent className="w-6 h-6" />
                        {step.completed && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Step Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium ${step.completed ? 'text-foreground' : isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                            {step.title}
                          </h4>
                          {step.timestamp && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(step.timestamp), 'HH:mm', { locale: fr })}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {step.description}
                        </p>
                        
                        {step.estimated && !step.completed && (
                          <div className="flex items-center gap-1 text-xs text-primary">
                            <Clock className="w-3 h-3" />
                            {step.estimated}
                          </div>
                        )}
                        
                        {step.timestamp && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(step.timestamp), 'EEEE dd MMMM à HH:mm', { locale: fr })}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {selectedOrder.status === 'delivered' && selectedOrder.buyer_id === user?.id && (
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="font-medium mb-2">Confirmez la réception</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Avez-vous bien reçu votre commande ?
                </p>
                <Button onClick={() => setShowRatingDialog(true)}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmer la réception
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Address */}
        {selectedOrder.delivery_address && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Adresse de livraison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{selectedOrder.delivery_address}</p>
            </CardContent>
          </Card>
        )}

        {/* Driver Notes */}
        {selectedOrder.driver_notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Notes du livreur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{selectedOrder.driver_notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-card rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <>
        {renderOrderDetails()}
        
        {/* ✅ PHASE 3: Rating Dialog intégré */}
        <RateOrderDialog
          isOpen={showRatingDialog}
          onClose={() => setShowRatingDialog(false)}
          order={selectedOrder}
          onSuccess={() => {
            setSelectedOrder(null);
            setShowRatingDialog(false);
          }}
        />
      </>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold">Mes Commandes</h2>
          <p className="text-sm text-muted-foreground">
            Suivi en temps réel de vos commandes
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNotifications(true)}
          className="relative"
        >
          <Bell className="w-4 h-4 mr-2" />
          Notifications
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </div>
          )}
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">Aucune commande</h3>
            <p className="text-sm text-muted-foreground">
              Vos commandes apparaîtront ici une fois que vous aurez effectué des achats
            </p>
          </CardContent>
        </Card>
      ) : (
        renderOrdersList()
      )}
    </div>
  );
};