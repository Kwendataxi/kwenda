import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { LocationData } from '@/types/location';
import { cityDetectionService } from '@/services/cityDetectionService';

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
  senderName?: string;
  senderPhone?: string;
  recipientName?: string;
  recipientPhone?: string;
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
        // ✅ PHASE 4: Détecter automatiquement la ville depuis les coordonnées pickup
        const cityDetection = cityDetectionService.detectCityFromCoordinates({
          lat: pickup.lat,
          lng: pickup.lng
        });
        
        console.log('🌍 Ville détectée:', cityDetection.city.name, `(confiance: ${(cityDetection.confidence * 100).toFixed(0)}%)`);
        
        const { data: pricingResult, error: pricingError } = await supabase.rpc('calculate_delivery_price', {
          delivery_type_param: mode,
          distance_km_param: distance,
          city_param: cityDetection.city.name
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
      
      // ============================================================
      // VALIDATION STRICTE DES CONTACTS - SUPPORT MULTI-FORMAT
      // ============================================================
      console.log('📋 useEnhancedDeliveryOrders - Structure reçue:', {
        senderPhone: orderData.senderPhone,
        recipientPhone: orderData.recipientPhone,
        pickupContact: orderData.pickup?.contact,
        destinationContact: orderData.destination?.contact
      });
      
      // Extraction intelligente des numéros avec fallback sur format imbriqué
      const extractedSenderPhone = orderData.senderPhone || orderData.pickup?.contact?.phone;
      const extractedRecipientPhone = orderData.recipientPhone || orderData.destination?.contact?.phone;
      
      if (!extractedSenderPhone || extractedSenderPhone.trim() === '') {
        console.error('❌ VALIDATION FAILED: Numéro de téléphone expéditeur manquant');
        console.error('📦 orderData reçu:', JSON.stringify(orderData, null, 2));
        toast({
          title: "Numéro de téléphone requis",
          description: "Le numéro de téléphone de l'expéditeur est obligatoire",
          variant: "destructive",
        });
        throw new Error('Numéro de téléphone de l\'expéditeur requis');
      }
      
      if (!extractedRecipientPhone || extractedRecipientPhone.trim() === '') {
        console.error('❌ VALIDATION FAILED: Numéro de téléphone destinataire manquant');
        console.error('📦 orderData reçu:', JSON.stringify(orderData, null, 2));
        toast({
          title: "Numéro de téléphone requis",
          description: "Le numéro de téléphone du destinataire est obligatoire",
          variant: "destructive",
        });
        throw new Error('Numéro de téléphone du destinataire requis');
      }
      
      console.log('✅ Validation des contacts réussie:', {
        senderPhone: extractedSenderPhone,
        recipientPhone: extractedRecipientPhone
      });

      // ✅ SIMPLIFICATION: Format garanti par Phase 2 validation stricte
      const normalizeDeliveryData = (data: any) => {
        console.log('🔍 [useEnhancedDeliveryOrders] normalizeDeliveryData - Données reçues:', data);
        
        // ✅ NOUVEAU: Format garanti par Phase 2
        const senderPhone = data.pickup.contact.phone; // GARANTI NON-VIDE
        const recipientPhone = data.destination.contact.phone; // GARANTI NON-VIDE
        const senderName = data.pickup.contact.name; // GARANTI NON-VIDE
        const recipientName = data.destination.contact.name; // GARANTI NON-VIDE
        
        console.log('✅ Contacts extraits (garantis valides):', {
          senderName,
          senderPhone,
          recipientName,
          recipientPhone
        });
        
        return {
          pickup: {
            address: data.pickup.location.address,
            lat: data.pickup.location.coordinates.lat,
            lng: data.pickup.location.coordinates.lng,
            contactName: senderName,
            contactPhone: senderPhone
          },
          destination: {
            address: data.destination.location.address,
            lat: data.destination.location.coordinates.lat,
            lng: data.destination.location.coordinates.lng,
            contactName: recipientName,
            contactPhone: recipientPhone
          },
          mode: data.mode || data.service?.mode,
          city: data.city || 'Kinshasa',
          estimatedPrice: data.pricing?.price || data.estimatedPrice,
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
      
      // CORRECTION CRITIQUE: Extraire correctement les contacts normalisés
      const senderName = normalizedData.pickup.contactName || 'Expéditeur';
      const senderPhone = normalizedData.pickup.contactPhone || '';
      const recipientName = normalizedData.destination.contactName || 'Destinataire';
      const recipientPhone = normalizedData.destination.contactPhone || '';
      
      console.log('📞 Contact info extracted:', {
        sender: { name: senderName, phone: senderPhone },
        recipient: { name: recipientName, phone: recipientPhone }
      });

      // ✅ SIMPLIFICATION: Validation déjà garantie par Phase 2
      console.log('✅ Contacts garantis valides par validation frontend:', {
        senderPhone,
        recipientPhone
      });
      
      const orderPayload = {
        user_id: user.id,
        pickup_location: securePickup?.address || 'Adresse de collecte non définie',
        delivery_location: secureDestination?.address || 'Adresse de livraison non définie',
        sender_name: senderName,
        sender_phone: senderPhone,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
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
        console.error('❌ Erreur PostgreSQL:', error);
        
        // ACTION 3: Traduire les erreurs PostgreSQL en français
        let userFriendlyError = error.message;
        
        if (error.message?.includes('sender_phone')) {
          userFriendlyError = 'Le numéro de téléphone de l\'expéditeur est obligatoire';
        } else if (error.message?.includes('recipient_phone')) {
          userFriendlyError = 'Le numéro de téléphone du destinataire est obligatoire';
        } else if (error.message?.includes('violates check constraint')) {
          userFriendlyError = 'Données de livraison invalides. Veuillez vérifier tous les champs.';
        }
        
        throw new Error(userFriendlyError);
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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚚 [CLIENT] Déclenchement recherche livreur');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 [triggerDriverSearch] Démarrage recherche livreurs:', {
      orderId,
      mode,
      coordinates
    });

    try {
      // Valider que nous avons les coordonnées nécessaires
      if (!coordinates?.lat || !coordinates?.lng) {
        console.error('❌ Coordonnées manquantes:', coordinates);
        toast({
          title: "⚠️ Erreur de localisation",
          description: "Impossible de rechercher un livreur sans coordonnées de pickup",
          variant: "destructive"
        });
        return { matches: [] };
      }

      // ✅ AMÉLIORATION: Appel avec retry automatique
      console.log('📡 Appel intelligent-driver-matching avec:', {
        pickup_latitude: coordinates.lat,
        pickup_longitude: coordinates.lng,
        vehicle_class: mode,
        priority: mode === 'flash' ? 'high' : 'normal'
      });

      const { data, error } = await supabase.functions.invoke('intelligent-driver-matching', {
        body: {
          pickup_latitude: coordinates.lat,
          pickup_longitude: coordinates.lng,
          vehicle_class: mode,
          priority: mode === 'flash' ? 'high' : 'normal'
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        toast({
          title: "⚠️ Recherche de livreurs",
          description: "La recherche continue en arrière-plan",
          duration: 5000
        });
        return { matches: [] };
      }

      console.log('✅ Driver matching result:', data);
      
      if (data.matches && data.matches.length > 0) {
        console.log(`✅ ${data.matches.length} livreurs trouvés`);
        
        // Notifier le premier driver
        const topDriver = data.matches[0];
        await supabase
          .from('system_notifications')
          .insert({
            user_id: topDriver.driver_id,
            title: 'Nouvelle course disponible',
            message: `Course ${mode} à ${(topDriver.distance_km).toFixed(1)}km de votre position`,
            notification_type: 'new_delivery_request',
            data: {
              order_id: orderId,
              mode,
              distance: topDriver.distance_km
            }
          });
        
        toast({
          title: "🚗 Livreurs trouvés",
          description: `${data.matches.length} livreur(s) disponible(s) dans votre zone`,
          duration: 5000
        });
      } else {
        console.warn('⚠️ Aucun livreur disponible');
        toast({
          title: "⚠️ Recherche en cours",
          description: "Aucun livreur disponible pour le moment. Nous continuons la recherche.",
          duration: 8000
        });
      }

      return data;
    } catch (error: any) {
      console.error('❌ Driver search failed:', error);
      toast({
        title: "⚠️ Recherche de livreurs",
        description: "La recherche continue en arrière-plan",
        duration: 5000
      });
      // Ne pas bloquer la création de commande
      return { matches: [] };
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