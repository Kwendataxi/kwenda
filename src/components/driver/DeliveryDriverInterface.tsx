/**
 * 📦 Interface Livraison uniquement
 * Affiche SEULEMENT les livraisons (colis + marketplace)
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDriverDispatch } from '@/hooks/useDriverDispatch';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { ModernDriverHeader } from './ModernDriverHeader';
import { ModernOrderCard } from './ModernOrderCard';
import { DriverStatsPanel } from './DriverStatsPanel';
import DriverStatusToggle from './DriverStatusToggle';
import { NavigationModal } from './NavigationModal';
import { Package, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

export const DeliveryDriverInterface: React.FC = () => {
  const { status: driverStatus } = useDriverStatus();
  const {
    loading,
    pendingNotifications,
    activeOrders,
    acceptOrder,
    rejectOrder,
    completeOrder
  } = useDriverDispatch();

  const [navigationOpen, setNavigationOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Filtrer uniquement les livraisons
  const deliveryNotifications = pendingNotifications.filter(n => 
    n.type === 'delivery' || n.type === 'marketplace'
  );
  const deliveryActiveOrders = activeOrders.filter(o => 
    o.type === 'delivery' || o.type === 'marketplace'
  );

  const handleAcceptOrder = async (notification: any) => {
    const success = await acceptOrder(notification);
    if (success) {
      toast.success('✅ Livraison acceptée !');
    }
  };

  const handleRejectOrder = (notificationId: string) => {
    rejectOrder(notificationId);
    toast.info('Livraison refusée');
  };

  const handleCompleteOrder = async (orderId: string, type: 'delivery' | 'marketplace') => {
    const success = await completeOrder(orderId, type);
    if (success) {
      toast.success('✅ Livraison terminée !');
    }
  };

  const handleStartNavigation = async (order: any) => {
    try {
      const hasPickupCoords = order.pickup_coordinates?.lat && order.pickup_coordinates?.lng;
      const hasDestCoords = order.delivery_coordinates?.lat && order.delivery_coordinates?.lng;

      if (!hasPickupCoords || !hasDestCoords) {
        toast.loading('Géocodage des adresses...');
        
        const { data, error } = await supabase.functions.invoke('geocode-order', {
          body: { orderId: order.id, orderType: 'delivery' }
        });
        
        if (error) {
          toast.error('Impossible de calculer l\'itinéraire');
          return;
        }

        toast.dismiss();
        toast.success('Itinéraire calculé !');
        
        const { data: updatedOrder } = await supabase
          .from('delivery_orders')
          .select('*')
          .eq('id', order.id)
          .single();
        
        if (updatedOrder) {
          setSelectedOrder({ ...updatedOrder, type: order.type });
          setNavigationOpen(true);
        }
      } else {
        setSelectedOrder(order);
        setNavigationOpen(true);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Erreur lors du lancement de la navigation');
    }
  };

  // Mock stats (à remplacer par vraies données)
  const mockStats = {
    todayEarnings: 32000,
    todayTrips: 12,
    averageRating: 4.9,
    weeklyGoal: 250000,
    weeklyProgress: 58
  };

  return (
    <div className="space-y-4 pb-24">
      <ModernDriverHeader
        serviceType="delivery"
        driverName="Jean Dupont"
        notificationCount={deliveryNotifications.length}
      />

      <div className="px-4 space-y-4">
        {/* Status Toggle */}
        <DriverStatusToggle />

        {/* Stats Dashboard */}
        <DriverStatsPanel serviceType="delivery" stats={mockStats} />

        {/* Nouvelles livraisons */}
        {deliveryNotifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Package className="h-5 w-5" />
                  Nouvelles livraisons ({deliveryNotifications.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {deliveryNotifications.map((notification) => (
                  <Card key={notification.id} className="border-blue-300">
                    <CardContent className="p-4">
                      <ModernOrderCard
                        order={{
                          id: notification.orderId,
                          type: notification.type as any,
                          pickup: notification.location,
                          destination: 'À définir',
                          price: notification.estimatedPrice,
                          distance: notification.distance,
                          urgency: notification.urgency as any
                        }}
                      />
                      <div className="flex gap-2 mt-3">
                        <Button
                          onClick={() => handleAcceptOrder(notification)}
                          disabled={loading}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accepter
                        </Button>
                        <Button
                          onClick={() => handleRejectOrder(notification.id)}
                          variant="outline"
                          className="flex-1"
                          disabled={loading}
                        >
                          Refuser
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Livraisons en cours */}
        {deliveryActiveOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  Livraisons en cours ({deliveryActiveOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {deliveryActiveOrders.map((order) => (
                  <ModernOrderCard
                    key={order.id}
                    order={{
                      id: order.id,
                      type: order.type as any,
                      pickup: order.pickup_location,
                      destination: order.delivery_location,
                      price: order.delivery_fee || 0,
                      status: order.status
                    }}
                    onNavigate={() => handleStartNavigation(order)}
                    onComplete={() => handleCompleteOrder(order.id, order.type as any)}
                  />
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Message quand aucune livraison */}
        {!loading && deliveryNotifications.length === 0 && deliveryActiveOrders.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {driverStatus.isOnline 
                ? '📦 Aucune livraison disponible pour le moment. Vous êtes en ligne et prêt !' 
                : '⏸️ Passez en ligne pour recevoir des livraisons'}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Navigation Modal */}
      {selectedOrder && (
        <NavigationModal
          open={navigationOpen}
          onClose={() => setNavigationOpen(false)}
          orderId={selectedOrder.id}
          orderType="delivery"
          pickup={{
            lat: selectedOrder.pickup_coordinates?.lat || 0,
            lng: selectedOrder.pickup_coordinates?.lng || 0,
            address: selectedOrder.pickup_location || ''
          }}
          destination={{
            lat: selectedOrder.delivery_coordinates?.lat || 0,
            lng: selectedOrder.delivery_coordinates?.lng || 0,
            address: selectedOrder.delivery_location || ''
          }}
        />
      )}
    </div>
  );
};
