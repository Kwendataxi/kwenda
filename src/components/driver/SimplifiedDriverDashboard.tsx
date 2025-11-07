/**
 * 🎯 PHASE 3: Dashboard Carte Plein Écran
 * Grande carte Google Maps permanente avec position temps réel style Yango
 */

import React, { useState, useEffect } from 'react';
import { ModernOnlineToggle } from './ModernOnlineToggle';
import { FloatingStatsCard } from './FloatingStatsCard';
import { ActiveRideFloatingPanel } from './modals/ActiveRideFloatingPanel';
import { NewRidePopup } from './modals/NewRidePopup';
import { NavigationModal } from './NavigationModal';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';
import { useDriverDispatch } from '@/hooks/useDriverDispatch';
import { useDriverEarnings } from '@/hooks/useDriverEarnings';
import { useDriverHeartbeat } from '@/hooks/useDriverHeartbeat';
import { useDriverGeolocation } from '@/hooks/useDriverGeolocation';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useLiveDrivers } from '@/hooks/useLiveDrivers';
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
  const { status } = useDriverStatus();
  const { location } = useDriverGeolocation({ autoSync: true });
  
  // ✅ PHASE 3: Activer le heartbeat automatique
  useDriverHeartbeat();
  
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [onlineHours, setOnlineHours] = useState(0);

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

  // Calculer heures en ligne
  useEffect(() => {
    if (!status.isOnline) {
      setOnlineHours(0);
      return;
    }

    const interval = setInterval(() => {
      setOnlineHours(prev => prev + (1/60)); // Incrémenter chaque minute
    }, 60000);

    return () => clearInterval(interval);
  }, [status.isOnline]);

  return (
    <div className="h-screen flex flex-col">
      {/* Toggle Online fixe en haut - TOUJOURS VISIBLE */}
      <div className="bg-background border-b p-4 z-50">
        <ModernOnlineToggle />
      </div>
      
      {/* Carte plein écran */}
      <div className="flex-1 relative">
        <GoogleMapsKwenda
          center={location ? { lat: location.latitude, lng: location.longitude } : undefined}
          zoom={15}
          height="100%"
          driverLocation={location ? {
            lat: location.latitude,
            lng: location.longitude,
            heading: null
          } : undefined}
          pickup={relevantActiveOrders.length > 0 ? relevantActiveOrders[0].pickup_coordinates : undefined}
          destination={relevantActiveOrders.length > 0 ? (
            serviceType === 'taxi' 
              ? relevantActiveOrders[0].destination_coordinates 
              : relevantActiveOrders[0].delivery_coordinates
          ) : undefined}
          showRoute={relevantActiveOrders.length > 0}
        />
        
        {/* Overlay floating stats - toujours visible si en ligne */}
        {status.isOnline && (
          <FloatingStatsCard 
            todayEarnings={stats.todayEarnings || 0}
            todayTrips={stats.todayTrips || 0}
            onlineHours={onlineHours}
            position="top-right"
          />
        )}
      </div>

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
