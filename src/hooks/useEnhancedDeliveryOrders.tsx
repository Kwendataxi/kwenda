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
    console.log('Calcul prix livraison démarré:', { pickup, destination, mode });
    
    try {
      // Calculer la distance entre les points (formule haversine)
      const R = 6371; // Rayon de la Terre en km
      const dLat = (destination.lat - pickup.lat) * Math.PI / 180;
      const dLng = (destination.lng - pickup.lng) * Math.PI / 180;
      
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(pickup.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceKm = R * c;
      
      console.log('Distance calculée:', distanceKm, 'km');

      // Utiliser la nouvelle fonction de calcul dynamique
      try {
        const { data: priceData, error } = await supabase.rpc('calculate_delivery_price', {
          p_service_type: mode,
          p_distance_km: distanceKm,
          p_city: 'Kinshasa' // TODO: Récupérer la ville depuis le contexte utilisateur
        });

        if (error) throw error;

        const estimatedDuration = distanceKm * 3; // 3 minutes par km en moyenne

        const result = {
          price: (priceData as any)?.calculated_price || 5000,
          distance: Math.round(distanceKm * 1000) / 1000,
          duration: Math.round(estimatedDuration)
        };
        
        console.log('Calcul prix dynamique terminé:', result);
        return result;
      } catch (dbError) {
        console.error('Erreur calcul prix dynamique:', dbError);
        // Fallback to old calculation
      }

      // Tarifs réalistes pour l'Afrique (CDF) - Fallback
      const tarifs = {
        flash: { base: 5000, perKm: 500, speedFactor: 1.5 },    // Ultra rapide moto
        flex: { base: 3000, perKm: 300, speedFactor: 1.0 },     // Standard voiture  
        maxicharge: { base: 8000, perKm: 800, speedFactor: 0.7 } // Gros colis camion
      } as const;

      const tarif = tarifs[mode];
      const prix = Math.round(tarif.base + (distanceKm * tarif.perKm));
      
      // Calcul du temps selon le mode et la distance (trafic Kinshasa/Abidjan)
      const vitesseMoyenne = mode === 'flash' ? 25 : mode === 'flex' ? 20 : 15; // km/h
      const dureeMinutes = Math.max(15, Math.round((distanceKm / vitesseMoyenne) * 60));

      const result = {
        price: prix,
        distance: Math.round(distanceKm * 1000) / 1000, // Arrondi à 3 décimales
        duration: dureeMinutes
      };
      
      console.log('Calcul prix livraison terminé:', result);
      return result;
    } catch (error) {
      console.error('Erreur calcul prix livraison:', error);
      
      // Prix de secours réalistes
      const fallback = {
        price: mode === 'flash' ? 8000 : mode === 'flex' ? 5000 : 12000,
        distance: 5,
        duration: mode === 'flash' ? 25 : mode === 'flex' ? 35 : 45
      };
      
      console.log('Utilisation prix fallback:', fallback);
      return fallback;
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