import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GoogleMapsService } from '@/services/googleMapsService';

export interface DeliveryLocation {
  address: string;
  lat: number;
  lng: number;
  details?: string;
}

export interface DeliveryOrderData {
  city: string;
  pickup: DeliveryLocation;
  destination: DeliveryLocation;
  mode: 'flash' | 'flex' | 'maxicharge';
  packageType?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  specialInstructions?: string;
  estimatedPrice: number;
  distance: number;
  duration: number;
}

export const useEnhancedDeliveryOrders = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const calculateDeliveryPrice = async (
    pickup: DeliveryLocation,
    destination: DeliveryLocation,
    mode: 'flash' | 'flex' | 'maxicharge'
  ): Promise<{ price: number; distance: number; duration: number }> => {
    try {
      const distanceData = await GoogleMapsService.calculateDistance(pickup, destination);
      
      // Tarification basée sur la distance et le mode
      const basePrices = {
        flash: 5000, // CDF - livraison rapide moto
        flex: 3000,  // CDF - livraison standard
        maxicharge: 8000 // CDF - gros colis camion
      };

      const pricePerKm = {
        flash: 500,
        flex: 300,
        maxicharge: 800
      };

      const distanceKm = distanceData.distance / 1000;
      const price = basePrices[mode] + (distanceKm * pricePerKm[mode]);

      return {
        price: Math.round(price),
        distance: distanceData.distance,
        duration: distanceData.duration
      };
    } catch (error) {
      console.error('Erreur calcul prix:', error);
      // Prix par défaut en cas d'erreur
      return {
        price: mode === 'flash' ? 8000 : mode === 'flex' ? 5000 : 12000,
        distance: 5000, // 5km par défaut
        duration: 1800  // 30min par défaut
      };
    }
  };

  const createDeliveryOrder = async (orderData: DeliveryOrderData): Promise<string> => {
    setSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Créer la commande dans la base de données
      const { data: order, error } = await supabase
        .from('delivery_orders')
        .insert({
          user_id: user.id,
          pickup_location: orderData.pickup.address,
          delivery_location: orderData.destination.address,
          delivery_type: orderData.mode,
          estimated_price: orderData.estimatedPrice,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Commande créée",
        description: `Votre commande de livraison ${orderData.mode} a été créée avec succès`,
      });

      return order.id;
    } catch (error: any) {
      console.error('Erreur création commande:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la commande",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const getUserOrders = async () => {
    setLoading(true);
    
    try {
      const { data: orders, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return orders || [];
    } catch (error: any) {
      console.error('Erreur récupération commandes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer vos commandes",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const trackOrder = async (orderId: string) => {
    try {
      const { data: order, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        throw error;
      }

      return order;
    } catch (error: any) {
      console.error('Erreur suivi commande:', error);
      toast({
        title: "Erreur",
        description: "Impossible de suivre cette commande",
        variant: "destructive"
      });
      return null;
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({ 
          status: 'cancelled'
        })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      toast({
        title: "Commande annulée",
        description: "Votre commande a été annulée avec succès",
      });

      return true;
    } catch (error: any) {
      console.error('Erreur annulation commande:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler cette commande",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    loading,
    submitting,
    calculateDeliveryPrice,
    createDeliveryOrder,
    getUserOrders,
    trackOrder,
    cancelOrder
  };
};