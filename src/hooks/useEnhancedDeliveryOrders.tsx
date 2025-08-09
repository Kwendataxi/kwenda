import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { IntegrationGeocodingService } from '@/services/integrationGeocoding';

// Harmoniser avec LocationResult de UnifiedLocationService
export interface DeliveryLocation {
  address: string;
  lat: number;
  lng: number;
  type?: 'geocoded' | 'popular' | 'fallback';
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
      // Calculer la distance entre les points
      const distanceKm = IntegrationGeocodingService.calculateDistance(
        pickup.lat, pickup.lng,
        destination.lat, destination.lng
      );

      // Récupérer les tarifs dynamiques depuis l'admin (pricing_rules)
      const { data: rule, error: pricingError } = await supabase
        .from('pricing_rules')
        .select('base_price, price_per_km, currency')
        .eq('service_type', 'delivery')
        .eq('vehicle_class', mode)
        .eq('is_active', true)
        .maybeSingle();

      if (pricingError) {
        console.warn('Impossible de récupérer les tarifs dynamiques:', pricingError);
      }

      const defaults = {
        flash: { base: 5000, perKm: 500 },
        flex: { base: 3000, perKm: 300 },
        maxicharge: { base: 8000, perKm: 800 }
      } as const;

      const base = rule?.base_price ?? defaults[mode].base;
      const perKm = rule?.price_per_km ?? defaults[mode].perKm;

      const price = base + (distanceKm * perKm);
      const durationMinutes = distanceKm * 3; // 3 min par km

      return {
        price: Math.round(price),
        distance: distanceKm * 1000, // convertir en mètres
        duration: durationMinutes * 60 // convertir en secondes
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
      console.log('Création commande livraison - Données:', orderData);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      console.log('Utilisateur authentifié:', user.id);

      // Préparer les coordonnées JSON
      const pickupCoords = {
        lat: orderData.pickup.lat,
        lng: orderData.pickup.lng,
        type: orderData.pickup.type
      };
      
      const deliveryCoords = {
        lat: orderData.destination.lat,
        lng: orderData.destination.lng,
        type: orderData.destination.type
      };

      // Créer la commande avec toutes les données
      const orderPayload = {
        user_id: user.id,
        pickup_location: orderData.pickup.address,
        delivery_location: orderData.destination.address,
        pickup_coordinates: pickupCoords,
        delivery_coordinates: deliveryCoords,
        delivery_type: orderData.mode,
        estimated_price: orderData.estimatedPrice,
        status: 'pending'
      };

      console.log('Données à insérer:', orderPayload);

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