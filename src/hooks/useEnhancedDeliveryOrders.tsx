import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { LocationData } from '@/services/MasterLocationService';

// Export for backward compatibility
export type DeliveryLocation = LocationData;

export interface DeliveryOrderData {
  city: string;
  pickup: LocationData;
  destination: LocationData;
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
    pickup: LocationData,
    destination: LocationData,
    mode: 'flash' | 'flex' | 'maxicharge'
  ): Promise<{ price: number; distance: number; duration: number }> => {
    try {
      console.log('Calculating delivery price for mode:', mode);
      
      // Try to get pricing config from database first
      const { data: pricingConfig, error: configError } = await supabase
        .from('pricing_configs')
        .select('*')
        .eq('service_type', mode)
        .eq('city', 'Kinshasa')
        .eq('active', true)
        .single();

      // Calculate distance using Haversine formula
      const R = 6371; // Earth radius in km
      const dLat = (destination.lat - pickup.lat) * Math.PI / 180;
      const dLng = (destination.lng - pickup.lng) * Math.PI / 180;
      
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(pickup.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      const duration = distance / 30 * 60; // 30 km/h average speed
      
      let calculatedPrice: number;

      if (!configError && pricingConfig) {
        // Use database pricing
        calculatedPrice = Math.max(
          pricingConfig.base_price + (distance * pricingConfig.price_per_km),
          pricingConfig.minimum_fare
        );
        console.log('Using database pricing config:', pricingConfig);
      } else {
        // Fallback to hardcoded pricing
        console.log('Using fallback pricing. Config error:', configError?.message);
        const tariffs = {
          flash: { base: 5000, perKm: 500, minFare: 4000 },
          flex: { base: 3000, perKm: 300, minFare: 2500 },
          maxicharge: { base: 8000, perKm: 800, minFare: 6000 }
        };

        const tariff = tariffs[mode];
        calculatedPrice = Math.max(
          tariff.base + (distance * tariff.perKm),
          tariff.minFare
        );
      }

      const result = {
        price: Math.round(calculatedPrice),
        distance: Math.round(distance * 100) / 100,
        duration: Math.round(duration)
      };

      console.log('Price calculation result:', result);
      return result;

    } catch (error) {
      console.error('Error calculating delivery price:', error);
      
      // Emergency fallback with fixed prices
      const emergencyPrices = {
        flash: 7000,
        flex: 4500,
        maxicharge: 10000
      };

      return {
        price: emergencyPrices[mode],
        distance: 5,
        duration: 30
      };
    }
  };

  const createDeliveryOrder = async (orderData: DeliveryOrderData): Promise<string> => {
    setSubmitting(true);
    
    try {
      console.log('Création commande livraison - Données:', orderData);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      console.log('Utilisateur authentifié:', user.id);

      // VALIDATION ULTRA-ROBUSTE DES COORDONNÉES
      const { secureLocation } = await import('@/utils/locationValidation');
      
      // Sécuriser et valider pickup
      const securePickup = secureLocation(orderData.pickup, orderData.city);
      const secureDestination = secureLocation(orderData.destination, orderData.city);
      
      console.log('Coordonnées sécurisées:', {
        pickup: securePickup,
        destination: secureDestination
      });

      // Préparer les coordonnées JSON avec fallbacks robustes
      const pickupCoords = {
        lat: securePickup?.lat || securePickup?.coordinates?.lat || -4.3217,
        lng: securePickup?.lng || securePickup?.coordinates?.lng || 15.3069,
        type: securePickup?.type || 'fallback'
      };
      
      const deliveryCoords = {
        lat: secureDestination?.lat || secureDestination?.coordinates?.lat || -4.3217,
        lng: secureDestination?.lng || secureDestination?.coordinates?.lng || 15.3069,
        type: secureDestination?.type || 'fallback'
      };

      // Validation finale pour éviter les erreurs "Cannot read properties of undefined"
      if (!pickupCoords.lat || !pickupCoords.lng || !deliveryCoords.lat || !deliveryCoords.lng) {
        throw new Error('Coordonnées invalides - Impossible de créer la commande');
      }

      // Créer la commande avec données sécurisées et validation stricte
      const validDeliveryType = orderData.mode || 'flex'; // Fallback par défaut
      
      const orderPayload = {
        user_id: user.id,
        pickup_location: securePickup?.address || 'Adresse de collecte non définie',
        delivery_location: secureDestination?.address || 'Adresse de livraison non définie',
        pickup_coordinates: pickupCoords,
        delivery_coordinates: deliveryCoords,
        delivery_type: validDeliveryType,
        estimated_price: orderData.estimatedPrice || 0,
        status: 'pending'
      };

      console.log('Données sécurisées à insérer:', orderPayload);

      const { data: order, error } = await supabase
        .from('delivery_orders')
        .insert(orderPayload)
        .select()
        .single();

      if (error) {
        console.error('Erreur base de données:', error);
        throw error;
      }

      console.log('Commande créée avec succès:', order.id);

      toast({
        title: "Commande créée ✅",
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