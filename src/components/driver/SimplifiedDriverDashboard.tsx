/**
 * 🎯 PHASE 1: Dashboard Simplifié Chauffeur
 * Interface épurée avec hiérarchie visuelle claire
 */

import React, { useState } from 'react';
import { CompactStatusCard } from './CompactStatusCard';
import { AvailableRidesSection } from './AvailableRidesSection';
import { ActiveRideHighlight } from './ActiveRideHighlight';
import { CompactStatsBar } from './CompactStatsBar';
import { ActiveRideFloatingPanel } from './modals/ActiveRideFloatingPanel';
import { NewRidePopup } from './modals/NewRidePopup';
import { NavigationModal } from './NavigationModal';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import { useDriverDispatch } from '@/hooks/useDriverDispatch';
import { useDriverEarnings } from '@/hooks/useDriverEarnings';
import { useDriverHeartbeat } from '@/hooks/useDriverHeartbeat';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SimplifiedDriverDashboardProps {
  serviceType: 'taxi' | 'delivery';
}

export const SimplifiedDriverDashboard: React.FC<SimplifiedDriverDashboardProps> = ({ serviceType }) => {
  const {
    loading,
    pendingNotifications,
    activeOrders,
    acceptOrder,
    rejectOrder,
    completeOrder
  } = useDriverDispatch();

  const { stats, loading: statsLoading } = useDriverEarnings();
  
  // ✅ PHASE 3: Activer le heartbeat automatique toutes les 2 minutes
  useDriverHeartbeat();
  
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showStatsPage, setShowStatsPage] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  // Filtrer selon le type de service
  const relevantNotifications = pendingNotifications.filter(n => 
    serviceType === 'taxi' ? n.type === 'taxi' : (n.type === 'delivery' || n.type === 'marketplace')
  );
  
  const relevantActiveOrders = activeOrders.filter(o => 
    serviceType === 'taxi' ? o.type === 'taxi' : (o.type === 'delivery' || o.type === 'marketplace')
  );

  const handleAcceptOrder = async (notification: any) => {
    const success = await acceptOrder(notification);
    if (success) {
      toast.success(`✅ ${serviceType === 'taxi' ? 'Course' : 'Livraison'} acceptée !`);
      setSelectedNotification(null);
    }
  };

  const handleRejectOrder = (notificationId: string) => {
    rejectOrder(notificationId);
    toast.info('Refusée');
    setSelectedNotification(null);
  };

  const handleCompleteOrder = async (orderId: string, type: string) => {
    const success = await completeOrder(orderId, type as any);
    if (success) {
      toast.success('✅ Terminée !');
    }
  };

  const handleStartNavigation = async (order: any) => {
    try {
      const pickupField = serviceType === 'taxi' ? 'pickup_coordinates' : 'pickup_coordinates';
      const destField = serviceType === 'taxi' ? 'destination_coordinates' : 'delivery_coordinates';
      
      const hasPickupCoords = order[pickupField]?.lat && order[pickupField]?.lng;
      const hasDestCoords = order[destField]?.lat && order[destField]?.lng;

      if (!hasPickupCoords || !hasDestCoords) {
        toast.loading('Géocodage des adresses...');
        
        const { data, error } = await supabase.functions.invoke('geocode-order', {
          body: { orderId: order.id, orderType: serviceType === 'taxi' ? 'transport' : 'delivery' }
        });
        
        if (error) {
          toast.error('Impossible de calculer l\'itinéraire');
          return;
        }

        toast.dismiss();
        toast.success('Itinéraire calculé !');
        
        const table = serviceType === 'taxi' ? 'transport_bookings' : 'delivery_orders';
        const { data: updatedOrder } = await supabase
          .from(table)
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

  return (
    <div className="space-y-4 pb-24 px-4">
      {/* Header Status - Repliable */}
      <CompactStatusCard serviceType={serviceType} />

      {/* Barre de Stats Compacte - Seulement 2 KPIs */}
      <CompactStatsBar
        todayEarnings={stats.todayEarnings || 0}
        totalRides={stats.todayTrips || 0}
        onClick={() => setShowStatsPage(true)}
      />

      {/* Course Active - Priorité visuelle maximale */}
      {relevantActiveOrders.length > 0 && (
        <ActiveRideHighlight
          order={relevantActiveOrders[0]}
          onNavigate={() => handleStartNavigation(relevantActiveOrders[0])}
          onComplete={() => handleCompleteOrder(relevantActiveOrders[0].id, relevantActiveOrders[0].type)}
        />
      )}

      {/* Section Courses Disponibles */}
      <AvailableRidesSection
        notifications={relevantNotifications}
        serviceType={serviceType}
        onAccept={(notification) => setSelectedNotification(notification)}
        onReject={handleRejectOrder}
      />

      {/* Bouton Stats Complètes */}
      {!showStatsPage && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowStatsPage(true)}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Voir mes statistiques complètes
        </Button>
      )}

      {/* Popup Nouvelle Course */}
      {selectedNotification && (
        <NewRidePopup
          open={!!selectedNotification}
          notification={selectedNotification}
          serviceType={serviceType}
          onAccept={() => handleAcceptOrder(selectedNotification)}
          onReject={() => handleRejectOrder(selectedNotification.id)}
          onClose={() => setSelectedNotification(null)}
        />
      )}

      {/* Panel Flottant Course Active */}
      {relevantActiveOrders.length > 0 && (
        <ActiveRideFloatingPanel
          order={relevantActiveOrders[0]}
          onNavigate={() => handleStartNavigation(relevantActiveOrders[0])}
          onComplete={() => handleCompleteOrder(relevantActiveOrders[0].id, relevantActiveOrders[0].type)}
        />
      )}

      {/* Navigation Modal */}
      {selectedOrder && (
        <NavigationModal
          open={navigationOpen}
          onClose={() => setNavigationOpen(false)}
          orderId={selectedOrder.id}
          orderType={serviceType === 'taxi' ? 'transport' : 'delivery'}
          pickup={{
            lat: selectedOrder.pickup_coordinates?.lat || 0,
            lng: selectedOrder.pickup_coordinates?.lng || 0,
            address: selectedOrder.pickup_location || ''
          }}
          destination={{
            lat: (serviceType === 'taxi' 
              ? selectedOrder.destination_coordinates?.lat 
              : selectedOrder.delivery_coordinates?.lat) || 0,
            lng: (serviceType === 'taxi' 
              ? selectedOrder.destination_coordinates?.lng 
              : selectedOrder.delivery_coordinates?.lng) || 0,
            address: (serviceType === 'taxi' 
              ? selectedOrder.destination 
              : selectedOrder.delivery_location) || ''
          }}
          customerPhone={selectedOrder.customer_phone}
        />
      )}
    </div>
  );
};
