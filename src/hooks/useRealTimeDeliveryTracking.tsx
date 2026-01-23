/**
 * 🎯 HOOK UNIFIÉ POUR SUIVI TEMPS RÉEL DES LIVRAISONS
 * 
 * Corrige tous les problèmes de tracking :
 * - Géolocalisation chauffeur temps réel
 * - Chat client-chauffeur fonctionnel
 * - Communication téléphonique
 * - Synchronisation Supabase
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

interface DeliveryTrackingData {
  order: {
    id: string;
    status: string;
    pickup_location: string;
    delivery_location: string;
    pickup_coordinates: any;
    delivery_coordinates: any;
    delivery_type: string;
    estimated_price: number;
    actual_price?: number;
    user_id: string;
    driver_id?: string;
    created_at: string;
    updated_at: string;
  } | null;
  driverLocation: {
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    google_address?: string;
    google_place_name?: string;
    last_ping: string;
    is_online: boolean;
    is_available: boolean;
  } | null;
  driverProfile: {
    id: string;
    display_name: string;
    phone_number: string;
    profile_photo_url?: string;
    vehicle_model?: string;
    vehicle_plate?: string;
    vehicle_color?: string;
    rating_average?: number;
    rating_count?: number;
  } | null;
  clientProfile: {
    id: string;
    display_name: string;
    phone_number: string;
  } | null;
  chatMessages: ChatMessage[];
  eta: number | null;
  distance: number | null;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_type: 'client' | 'driver';
  message: string;
  sent_at: string;
  read_at?: string;
  metadata?: any;
}

interface UseRealTimeDeliveryTrackingOptions {
  orderId: string;
  enableDriverTracking?: boolean;
  enableChat?: boolean;
  pollingInterval?: number;
}

export function useRealTimeDeliveryTracking({
  orderId,
  enableDriverTracking = true,
  enableChat = true,
  pollingInterval = 5000
}: UseRealTimeDeliveryTrackingOptions) {
  const { user } = useAuth();
  const { userRole } = useUserRole();
  
  const [trackingData, setTrackingData] = useState<DeliveryTrackingData>({
    order: null,
    driverLocation: null,
    driverProfile: null,
    clientProfile: null,
    chatMessages: [],
    eta: null,
    distance: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  const channelRef = useRef<any>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== CHARGEMENT INITIAL ====================
  
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les données de commande
      const { data: orderData, error: orderError } = await supabase
        .from('delivery_orders')
        .select(`
          *,
          clients!delivery_orders_user_id_fkey(
            id, display_name, phone_number
          ),
          chauffeurs!delivery_orders_driver_id_fkey(
            id, display_name, phone_number, profile_photo_url, 
            vehicle_model, vehicle_plate, vehicle_color,
            rating_average, rating_count
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) {
        throw new Error(`Erreur chargement commande: ${orderError.message}`);
      }

      if (!orderData) {
        throw new Error('Commande non trouvée');
      }

      // Charger l'historique du chat si activé
      let chatMessages: ChatMessage[] = [];
      if (enableChat) {
        const { data: chatData, error: chatError } = await supabase
          .from('delivery_chat_messages')
          .select('*')
          .eq('delivery_order_id', orderId)
          .order('sent_at', { ascending: true });

        if (!chatError && chatData) {
          chatMessages = chatData.map(msg => ({
            ...msg,
            sender_type: msg.sender_type as 'client' | 'driver'
          }));
        }
      }

      // Charger la position du chauffeur si assigné
      let driverLocation = null;
      if (orderData.driver_id && enableDriverTracking) {
        const { data: locationData } = await supabase
          .from('driver_locations')
          .select('*')
          .eq('driver_id', orderData.driver_id)
          .single();

        if (locationData) {
          driverLocation = {
            lat: locationData.latitude,
            lng: locationData.longitude,
            accuracy: locationData.accuracy,
            speed: locationData.speed,
            heading: locationData.heading,
            google_address: locationData.google_address,
            google_place_name: locationData.google_place_name,
            last_ping: locationData.last_ping,
            is_online: locationData.is_online,
            is_available: locationData.is_available
          };
        }
      }

      setTrackingData({
        order: orderData,
        driverLocation,
        driverProfile: (orderData as any).chauffeurs?.[0] || null,
        clientProfile: (orderData as any).clients?.[0] || null,
        chatMessages,
        eta: calculateETA(driverLocation, orderData.delivery_coordinates),
        distance: calculateDistance(driverLocation, orderData.delivery_coordinates)
      });

      setConnectionStatus('connected');

    } catch (err) {
      console.error('❌ Erreur chargement tracking:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, [orderId, enableDriverTracking, enableChat]);

  // ==================== SUBSCRIPTIONS TEMPS RÉEL ====================
  
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!trackingData.order) return;

    // Nettoyer les anciennes subscriptions
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Créer un channel pour cette commande
    const channel = supabase.channel(`delivery-tracking-${orderId}`);

    // 1. Écouter les mises à jour de commande
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'delivery_orders',
        filter: `id=eq.${orderId}`
      },
      (payload) => {
        console.log('📦 Mise à jour commande:', payload.new);
        setTrackingData(prev => ({
          ...prev,
          order: { ...prev.order!, ...payload.new }
        }));
        
        // Notification pour changement de statut
        if (payload.old?.status !== payload.new?.status) {
          toast.success(`Statut mis à jour: ${getStatusLabel(payload.new.status)}`);
        }
      }
    );

    // 2. Écouter la position du chauffeur en temps réel
    if (trackingData.order.driver_id && enableDriverTracking) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${trackingData.order.driver_id}`
        },
        (payload) => {
          console.log('📍 Position chauffeur mise à jour:', payload.new);
          const newLocation = {
            lat: payload.new.latitude,
            lng: payload.new.longitude,
            accuracy: payload.new.accuracy,
            speed: payload.new.speed,
            heading: payload.new.heading,
            google_address: payload.new.google_address,
            google_place_name: payload.new.google_place_name,
            last_ping: payload.new.last_ping,
            is_online: payload.new.is_online,
            is_available: payload.new.is_available
          };

          setTrackingData(prev => ({
            ...prev,
            driverLocation: newLocation,
            eta: calculateETA(newLocation, prev.order?.delivery_coordinates),
            distance: calculateDistance(newLocation, prev.order?.delivery_coordinates)
          }));
        }
      );
    }

    // 3. Écouter les nouveaux messages de chat
    if (enableChat) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_chat_messages',
          filter: `delivery_order_id=eq.${orderId}`
        },
        (payload) => {
          console.log('💬 Nouveau message:', payload.new);
          const newMessage = payload.new as ChatMessage;
          
          setTrackingData(prev => ({
            ...prev,
            chatMessages: [...prev.chatMessages, newMessage]
          }));

          // Notification si ce n'est pas notre message
          if (newMessage.sender_id !== user?.id) {
            const senderName = newMessage.sender_type === 'driver' 
              ? trackingData.driverProfile?.display_name || 'Chauffeur'
              : 'Client';
            toast.info(`💬 ${senderName}: ${newMessage.message}`);
          }
        }
      );
    }

    // S'abonner au channel
    channel.subscribe((status) => {
      console.log('📡 Statut subscription:', status);
      setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'connecting');
    });

    channelRef.current = channel;
  }, [orderId, trackingData.order, enableDriverTracking, enableChat, user?.id]);

  // ==================== FONCTIONS UTILITAIRES ====================
  
  const calculateETA = useCallback((driverLoc: any, destination: any): number | null => {
    if (!driverLoc || !destination) return null;
    
    try {
      const distance = calculateDistance(driverLoc, destination);
      if (!distance) return null;
      
      // ETA basé sur vitesse moyenne 30 km/h en ville
      const avgSpeed = 30; // km/h
      const etaHours = distance / avgSpeed;
      return Math.round(etaHours * 60); // En minutes
    } catch {
      return null;
    }
  }, []);

  const calculateDistance = useCallback((point1: any, point2: any): number | null => {
    if (!point1 || !point2) return null;
    
    try {
      const lat1 = point1.lat || point1.latitude;
      const lng1 = point1.lng || point1.longitude;
      const lat2 = point2.lat || point2.latitude || parseFloat(point2.lat);
      const lng2 = point2.lng || point2.longitude || parseFloat(point2.lng);
      
      if (!lat1 || !lng1 || !lat2 || !lng2) return null;
      
      const R = 6371; // Rayon de la Terre en km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    } catch {
      return null;
    }
  }, []);

  const getStatusLabel = useCallback((status: string): string => {
    const labels: Record<string, string> = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'driver_assigned': 'Chauffeur assigné',
      'picked_up': 'Récupérée',
      'in_transit': 'En livraison',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    };
    return labels[status] || status;
  }, []);

  // ==================== ACTIONS ====================
  
  const sendMessage = useCallback(async (message: string): Promise<boolean> => {
    if (!user || !trackingData.order) return false;
    
    try {
      const senderType = userRole === 'chauffeur' ? 'driver' : 'client';
      
      const { error } = await supabase
        .from('delivery_chat_messages')
        .insert({
          delivery_order_id: orderId,
          sender_id: user.id,
          sender_type: senderType,
          message: message.trim(),
          sent_at: new Date().toISOString()
        });

      if (error) throw error;
      
      return true;
    } catch (err) {
      console.error('❌ Erreur envoi message:', err);
      toast.error('Erreur envoi du message');
      return false;
    }
  }, [user, trackingData.order, userRole, orderId]);

  const callDriver = useCallback(() => {
    if (!trackingData.driverProfile?.phone_number) {
      toast.error('Numéro de téléphone non disponible');
      return;
    }

    const phoneNumber = trackingData.driverProfile.phone_number;
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Ouvrir l'application téléphone
    window.open(`tel:${cleanNumber}`, '_self');
    
    toast.success(`Appel en cours vers ${trackingData.driverProfile.display_name}...`);
  }, [trackingData.driverProfile]);

  const callClient = useCallback(() => {
    if (!trackingData.clientProfile?.phone_number) {
      toast.error('Numéro de téléphone non disponible');
      return;
    }

    const phoneNumber = trackingData.clientProfile.phone_number;
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    window.open(`tel:${cleanNumber}`, '_self');
    
    toast.success(`Appel en cours vers ${trackingData.clientProfile.display_name}...`);
  }, [trackingData.clientProfile]);

  const openMapsNavigation = useCallback(() => {
    const coords = trackingData.driverLocation;
    if (!coords) {
      toast.error('Position du chauffeur non disponible');
      return;
    }

    const url = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;
    window.open(url, '_blank');
  }, [trackingData.driverLocation]);

  const refreshTracking = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ==================== EFFETS ====================
  
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (trackingData.order && !loading) {
      setupRealtimeSubscriptions();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [setupRealtimeSubscriptions, trackingData.order, loading]);

  // Polling de sécurité pour s'assurer de la fraîcheur des données
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(() => {
      if (connectionStatus === 'connected' && trackingData.order?.driver_id) {
        // Vérifier si les données sont récentes (< 30 secondes)
        const lastUpdate = trackingData.driverLocation?.last_ping;
        if (lastUpdate) {
          const timeDiff = Date.now() - new Date(lastUpdate).getTime();
          if (timeDiff > 30000) { // 30 secondes
            console.log('🔄 Données obsolètes, refresh automatique...');
            refreshTracking();
          }
        }
      }
    }, pollingInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [connectionStatus, trackingData.driverLocation, pollingInterval, refreshTracking]);

  return {
    // État
    trackingData,
    loading,
    error,
    connectionStatus,
    
    // Actions
    sendMessage,
    callDriver,
    callClient,
    openMapsNavigation,
    refreshTracking,
    
    // Fonctions utilitaires
    getStatusLabel,
    calculateDistance,
    calculateETA
  };
}