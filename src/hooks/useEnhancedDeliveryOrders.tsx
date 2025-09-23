import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { LocationData } from '@/types/location';

// Export for backward compatibility
export type DeliveryLocation = LocationData;

export interface DeliveryOrderData {
  city: string;
  pickup: LocationData;
  destination: LocationData;
  mode: 'flash' | 'flex' | 'maxicharge';
  packageType?: string;
  packageWeight?: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  additionalInfo?: string;
  specialInstructions?: string;
  estimatedPrice?: number;
  distance?: number;
  duration?: number;
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
      console.log('🔢 Calculating price for:', { pickup, destination, mode });
      
      // Valider les coordonnées d'abord
      if (!pickup?.lat || !pickup?.lng || !destination?.lat || !destination?.lng) {
        throw new Error('Coordonnées invalides');
      }
      
      // Calculer la distance réelle
      const { calculateDistance } = await import('@/utils/locationValidation');
      const distance = calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
      console.log('📏 Distance calculated:', distance, 'km');
      
      // Utiliser la fonction RPC unifiée avec timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: Price calculation took too long')), 5000)
      );
      
      const pricePromise = (async () => {
        const { data: pricingResult, error: pricingError } = await supabase.rpc('calculate_delivery_price', {
          service_type_param: mode,
          distance_km_param: distance,
          city_param: 'Kinshasa'
        });
        
        if (pricingError) {
          console.warn('🚨 RPC Error:', pricingError);
          throw pricingError;
        }
        
        console.log('✅ RPC Result:', pricingResult);
        
        // Type assertion for RPC result
        const result = pricingResult as { calculated_price: number } | null;
        
        if (result && typeof result.calculated_price === 'number') {
          return {
            price: Math.round(result.calculated_price),
            distance: Number(distance.toFixed(2)),
            duration: Math.round(distance * 2.5) // Estimation: 2.5 min/km
          };
        }
        
        throw new Error('Invalid pricing result');
      })();
      
      const result = await Promise.race([pricePromise, timeoutPromise]);
      console.log('🎯 Final pricing result:', result);
      return result;
      
    } catch (error: any) {
      console.error('❌ Price calculation error:', error);
      
      // Fallback vers tarifs de base si erreur
      const fallbackPrices = {
        flash: 7000,
        flex: 4500,
        maxicharge: 10000
      };
      
      return {
        price: fallbackPrices[mode],
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

      // VALIDATION ROBUSTE DES DONNÉES DE LIVRAISON
      console.log('🔍 Debug orderData reçu:', JSON.stringify(orderData, null, 2));
      
      // Normalisation et validation des données essentielles
      const normalizeDeliveryData = (data: any) => {
        if (!data) throw new Error('Données de livraison manquantes');
        
        // Extraire les coordonnées avec plusieurs formats possibles
        const extractCoordinates = (locationData: any) => {
          let lat, lng;
          
          if (locationData.lat !== undefined && locationData.lng !== undefined) {
            lat = locationData.lat;
            lng = locationData.lng;
          } else if (locationData.coordinates) {
            lat = locationData.coordinates.lat;
            lng = locationData.coordinates.lng;
          } else if (locationData.location?.coordinates) {
            lat = locationData.location.coordinates.lat;
            lng = locationData.location.coordinates.lng;
          }
          
          return { lat: Number(lat), lng: Number(lng) };
        };
        
        // Extraire l'adresse avec plusieurs formats possibles
        const extractAddress = (locationData: any) => {
          return locationData.address || 
                 locationData.location?.address || 
                 locationData.name || 
                 'Adresse non définie';
        };
        
        const pickup = data.pickup;
        const destination = data.destination;
        
        if (!pickup) throw new Error('Données de collecte manquantes');
        if (!destination) throw new Error('Données de destination manquantes');
        
        const pickupCoords = extractCoordinates(pickup);
        const destCoords = extractCoordinates(destination);
        const pickupAddress = extractAddress(pickup);
        const destAddress = extractAddress(destination);
        
        // Validation des coordonnées
        if (isNaN(pickupCoords.lat) || isNaN(pickupCoords.lng)) {
          throw new Error('Coordonnées de collecte invalides');
        }
        if (isNaN(destCoords.lat) || isNaN(destCoords.lng)) {
          throw new Error('Coordonnées de destination invalides');
        }
        
        // Validation des adresses
        if (!pickupAddress || pickupAddress.trim() === '' || pickupAddress === 'Adresse non définie') {
          throw new Error('Adresse de collecte requise et valide');
        }
        if (!destAddress || destAddress.trim() === '' || destAddress === 'Adresse non définie') {
          throw new Error('Adresse de destination requise et valide');
        }
        
        return {
          pickup: {
            address: pickupAddress,
            lat: pickupCoords.lat,
            lng: pickupCoords.lng,
            contactName: pickup.contactName || '',
            contactPhone: pickup.contactPhone || ''
          },
          destination: {
            address: destAddress,
            lat: destCoords.lat,
            lng: destCoords.lng,
            contactName: destination.contactName || '',
            contactPhone: destination.contactPhone || ''
          },
          mode: data.mode,
          city: data.city || 'Kinshasa',
          estimatedPrice: data.estimatedPrice,
          distance: data.distance,
          duration: data.duration
        };
      };
      
      const normalizedData = normalizeDeliveryData(orderData);
      console.log('✅ Données normalisées:', normalizedData);
      
      // Validation finale avec locationValidation
      const { secureLocation } = await import('@/utils/locationValidation');
      
      let securePickup: any;
      let secureDestination: any;
      
      try {
        securePickup = secureLocation(normalizedData.pickup, normalizedData.city);
        secureDestination = secureLocation(normalizedData.destination, normalizedData.city);
        
        console.log('✅ Validation de sécurité réussie:', {
          securePickup: { address: securePickup.address, lat: securePickup.lat, lng: securePickup.lng },
          secureDestination: { address: secureDestination.address, lat: secureDestination.lat, lng: secureDestination.lng }
        });
      } catch (validationError: any) {
        console.error('❌ Erreur validation sécurité:', validationError);
        throw new Error(`Validation de sécurité échouée: ${validationError.message}`);
      }
      
      console.log('Coordonnées sécurisées:', {
        pickup: securePickup,
        destination: secureDestination
      });

      // Construction des coordonnées finales avec validation
      const pickupCoords = {
        lat: securePickup.lat,
        lng: securePickup.lng,
        type: securePickup.type || 'geocoded'
      };
      
      const deliveryCoords = {
        lat: secureDestination.lat,
        lng: secureDestination.lng,
        type: secureDestination.type || 'geocoded'
      };

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

      // Déclencher automatiquement la recherche de livreurs
      try {
        console.log('🚀 Déclenchement recherche de livreurs...');
        await triggerDriverSearch(order.id, orderData.mode, pickupCoords);
      } catch (searchError) {
        console.warn('⚠️ Erreur recherche livreurs:', searchError);
        // Ne pas bloquer la création de commande si la recherche échoue
      }

      toast({
        title: "Commande créée ✅",
        description: `Votre commande ${orderData.mode} a été créée. Recherche de livreurs en cours...`,
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

  // Fonction pour déclencher automatiquement la recherche de livreurs
  const triggerDriverSearch = async (orderId: string, mode: string, coordinates: any) => {
    console.log('🚚 [Livraison] Début recherche chauffeur:', { orderId, mode, coordinates });
    
    try {
      // Valider que nous avons les coordonnées nécessaires
      if (!coordinates?.lat || !coordinates?.lng) {
        console.error('❌ [Livraison] Coordonnées manquantes:', coordinates);
        throw new Error('Coordonnées de pickup manquantes');
      }

      const dispatchPayload = {
        orderId: orderId,
        pickupLat: coordinates.lat,
        pickupLng: coordinates.lng,
        deliveryType: mode
      };

      console.log('📡 [Livraison] Appel Edge Function delivery-dispatcher:', dispatchPayload);

      const { data, error } = await supabase.functions.invoke('delivery-dispatcher', {
        body: dispatchPayload
      });

      if (error) {
        console.error('❌ [Livraison] Erreur Edge Function:', error);
        throw error;
      }

      console.log('✅ [Livraison] Réponse Edge Function:', data);
      
      if (data?.success && data.driver) {
        console.log('🎉 [Livraison] Chauffeur assigné:', data.driver);
        toast({
          title: "Livreur assigné ✅",
          description: `${data.driver.vehicle_make} ${data.driver.vehicle_model} à ${data.driver.distance?.toFixed(1)}km`,
        });
      } else if (data?.driversFound > 0) {
        console.log('🔍 [Livraison] Livreurs trouvés:', data.driversFound);
        toast({
          title: "Livreurs disponibles 🔍",
          description: `${data.driversFound} livreurs trouvés dans votre zone`,
        });
      } else {
        console.warn('⚠️ [Livraison] Aucun chauffeur trouvé');
        toast({
          title: "Recherche élargie 🔍",
          description: data?.message || "Aucun livreur proche trouvé, recherche élargie en cours...",
        });
      }
    } catch (error: any) {
      console.error('❌ [Livraison] Erreur recherche chauffeur:', error);
      toast({
        title: "Recherche de livreurs",
        description: "Recherche de livreurs en cours, nous vous notifierons dès qu'un livreur sera disponible",
      });
    }
  };

  return {
    loading,
    submitting,
    calculateDeliveryPrice,
    createDeliveryOrder,
    getUserOrders,
    trackOrder,
    cancelOrder,
    triggerDriverSearch
  };
};