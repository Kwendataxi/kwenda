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

  return {
    loading,
    updateDeliveryStatus,
    confirmPickup,
    startDelivery,
    completeDelivery,
    getStatusLabel
  };
};