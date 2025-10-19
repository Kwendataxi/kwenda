/**
 * 🚗 Interface VTC uniquement
 * Affiche SEULEMENT les courses taxi/VTC
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDriverDispatch } from '@/hooks/useDriverDispatch';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useDriverEarnings } from '@/hooks/useDriverEarnings';
import { useAuth } from '@/hooks/useAuth';
import { ModernDriverHeader } from './ModernDriverHeader';
import { ModernOrderCard } from './ModernOrderCard';
import { DriverStatsPanel } from './DriverStatsPanel';
import DriverStatusToggle from './DriverStatusToggle';
import { NavigationModal } from './NavigationModal';
import { Car, AlertCircle, CheckCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

export const VTCDriverInterface: React.FC = () => {
  const { user } = useAuth();
  const { status: driverStatus, goOnline } = useDriverStatus();
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

  // Filtrer uniquement les courses VTC
  const vtcNotifications = pendingNotifications.filter(n => n.type === 'taxi');
  const vtcActiveOrders = activeOrders.filter(o => o.type === 'taxi');

  const handleAcceptOrder = async (notification: any) => {
    const success = await acceptOrder(notification);
    if (success) {
      toast.success('✅ Course VTC acceptée !');
    }
  };

  const handleRejectOrder = (notificationId: string) => {
    rejectOrder(notificationId);
    toast.info('Course refusée');
  };

  const handleCompleteOrder = async (orderId: string) => {
    const success = await completeOrder(orderId, 'taxi');
    if (success) {
      toast.success('✅ Course terminée !');
    }
  };

  const handleStartNavigation = async (order: any) => {
    try {
      const hasPickupCoords = order.pickup_coordinates?.lat && order.pickup_coordinates?.lng;
      const hasDestCoords = order.destination_coordinates?.lat && order.destination_coordinates?.lng;

      if (!hasPickupCoords || !hasDestCoords) {
        toast.loading('Géocodage des adresses...');
        
        const { data, error } = await supabase.functions.invoke('geocode-order', {
          body: { orderId: order.id, orderType: 'transport' }
        });
        
        if (error) {
          toast.error('Impossible de calculer l\'itinéraire');
          return;
        }

        toast.dismiss();
        toast.success('Itinéraire calculé !');
        
        const { data: updatedOrder } = await supabase
          .from('transport_bookings')
          .select('*')
          .eq('id', order.id)
          .single();
        
        if (updatedOrder) {
          setSelectedOrder({ ...updatedOrder, type: 'taxi' });
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

  // ✅ PHASE 2 : Charger les vraies stats
  const { stats, loading: statsLoading } = useDriverEarnings();

  return (
    <div className="space-y-4 pb-24">
      <ModernDriverHeader
        serviceType="taxi"
        driverName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Chauffeur'}
        notificationCount={vtcNotifications.length}
      />

      <div className="px-4 space-y-4">
        {/* Status Toggle */}
        <DriverStatusToggle />

        {/* Stats Dashboard */}
        <DriverStatsPanel serviceType="taxi" stats={stats} />

        {/* Nouvelles courses VTC */}
        {vtcNotifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                  <Car className="h-5 w-5" />
                  Nouvelles courses ({vtcNotifications.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {vtcNotifications.map((notification) => (
                  <Card key={notification.id} className="border-orange-300">
                    <CardContent className="p-4">
                      <ModernOrderCard
                        order={{
                          id: notification.orderId,
                          type: 'taxi',
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

        {/* Courses VTC en cours */}
        {vtcActiveOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  Courses en cours ({vtcActiveOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {vtcActiveOrders.map((order) => (
                  <ModernOrderCard
                    key={order.id}
                    order={{
                      id: order.id,
                      type: 'taxi',
                      pickup: order.pickup_location,
                      destination: order.destination,
                      price: order.estimated_price || 0,
                      status: order.status
                    }}
                    onNavigate={() => handleStartNavigation(order)}
                    onComplete={() => handleCompleteOrder(order.id)}
                  />
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ✅ PHASE 5: Dashboard des canaux actifs */}
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              Canaux de Réception Actifs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-background rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${driverStatus.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium">Courses VTC Directes</span>
              </div>
              <Badge variant="secondary">{vtcNotifications.filter(n => n.type === 'taxi').length} en attente</Badge>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-background rounded-lg opacity-50">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-gray-400 rounded-full" />
                <span className="text-sm font-medium">Pool de Courses</span>
              </div>
              <Badge variant="outline">Bientôt disponible</Badge>
            </div>
          </CardContent>
        </Card>

        {/* ✅ PHASE 4: Message amélioré quand aucune course */}
        {!loading && vtcNotifications.length === 0 && vtcActiveOrders.length === 0 && (
          <Card className="border-gray-200">
            <CardContent className="p-8 text-center">
              {driverStatus.isOnline ? (
                <>
                  <Car className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-bold mb-2">🚗 En attente de courses</h3>
                  <p className="text-muted-foreground mb-4">
                    Vous êtes en ligne. Les nouvelles courses apparaîtront ici automatiquement.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      💡 <strong>Astuce:</strong> Assurez-vous d'activer les notifications pour ne manquer aucune course !
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-16 w-16 mx-auto mb-4 text-orange-400" />
                  <h3 className="text-xl font-bold mb-2">⏸️ Vous êtes hors ligne</h3>
                  <p className="text-muted-foreground mb-4">
                    Passez en ligne pour commencer à recevoir des courses VTC
                  </p>
                  <Button 
                    onClick={() => goOnline()}
                    size="lg"
                    className="w-full max-w-sm"
                  >
                    🟢 Passer en ligne
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation Modal */}
      {selectedOrder && (
        <NavigationModal
          open={navigationOpen}
          onClose={() => setNavigationOpen(false)}
          orderId={selectedOrder.id}
          orderType="transport"
          pickup={{
            lat: selectedOrder.pickup_coordinates?.lat || 0,
            lng: selectedOrder.pickup_coordinates?.lng || 0,
            address: selectedOrder.pickup_location || ''
          }}
          destination={{
            lat: selectedOrder.destination_coordinates?.lat || 0,
            lng: selectedOrder.destination_coordinates?.lng || 0,
            address: selectedOrder.destination || ''
          }}
        />
      )}
    </div>
  );
};
