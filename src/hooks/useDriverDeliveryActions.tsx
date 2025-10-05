import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface DeliveryOrder {
  id: string;
  status: string;
  pickup_location: string;
  delivery_location: string;
  pickup_coordinates: any;
  delivery_coordinates: any;
  delivery_type: string;
  estimated_price: number;
  user_id: string;
}

export const useDriverDeliveryActions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = async (): Promise<{ lat: number; lng: number } | undefined> => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return undefined;
    }
  };

  const updateDeliveryStatus = async (
    orderId: string, 
    newStatus: 'confirmed' | 'driver_assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled',
    additionalData: any = {}
  ) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return false;
    }

    setLoading(true);
    try {
      const location = await getCurrentLocation();
      
      const { error } = await supabase.functions.invoke('delivery-status-manager', {
        body: {
          orderId,
          newStatus,
          driverId: user.id,
          locationCoordinates: location,
          ...additionalData
        }
      });

      if (error) throw error;

      toast.success(`Statut mis à jour: ${getStatusLabel(newStatus)}`);
      return true;

    } catch (error: any) {
      console.error('Error updating delivery status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const confirmPickup = async (orderId: string, notes?: string) => {
    return updateDeliveryStatus(orderId, 'picked_up', { driverNotes: notes });
  };

  const startDelivery = async (orderId: string) => {
    return updateDeliveryStatus(orderId, 'in_transit');
  };

  const completeDelivery = async (
    orderId: string, 
    recipientName: string, 
    deliveryPhoto?: File, 
    notes?: string
  ) => {
    const deliveryProof = {
      recipient_name: recipientName,
      delivery_time: new Date().toISOString(),
      photo_taken: !!deliveryPhoto,
      driver_notes: notes
    };

    return updateDeliveryStatus(orderId, 'delivered', {
      deliveryProof,
      recipientSignature: recipientName, // Simplified signature
      driverNotes: notes
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmée';
      case 'driver_assigned': return 'Assignée';
      case 'picked_up': return 'Récupérée';
      case 'in_transit': return 'En livraison';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const cancelDelivery = async (orderId: string, reason: string) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return false;
    }

    setLoading(true);
    try {
      // Get current order status
      const { data: order, error: fetchError } = await supabase
        .from('delivery_orders')
        .select('status, estimated_price')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      // Update order status
      const { error } = await supabase
        .from('delivery_orders')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: reason,
          cancellation_type: 'driver',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Log cancellation
      const { error: logError } = await supabase
        .from('cancellation_history')
        .insert({
          reference_id: orderId,
          reference_type: 'delivery_order',
          cancelled_by: user.id,
          cancellation_type: 'driver',
          reason,
          status_at_cancellation: order.status,
          metadata: {
            affects_reliability: order.status === 'driver_assigned',
            reliability_impact: -5
          }
        });

      if (logError) console.error('Error logging cancellation:', logError);

      if (order.status === 'driver_assigned' || order.status === 'picked_up') {
        toast.warning('⚠️ Cette annulation affecte votre taux de fiabilité');
      }

      toast.success('Livraison annulée');
      return true;

    } catch (error: any) {
      console.error('Error cancelling delivery:', error);
      toast.error('Erreur lors de l\'annulation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    updateDeliveryStatus,
    confirmPickup,
    startDelivery,
    completeDelivery,
    cancelDelivery,
    getStatusLabel
  };
};