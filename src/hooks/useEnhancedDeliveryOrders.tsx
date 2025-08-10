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

      // Tarifs réalistes pour l'Afrique (CDF)
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