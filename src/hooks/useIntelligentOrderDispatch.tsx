import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface OrderRequest {
  id: string;
  type: 'taxi' | 'delivery' | 'marketplace';
  pickup_location: string;
  delivery_location?: string;
  pickup_coordinates?: { lat: number; lng: number };
  delivery_coordinates?: { lat: number; lng: number };
  estimated_price: number;
  priority: 'normal' | 'high' | 'urgent';
  created_at: string;
  customer_id: string;
  special_requirements?: string;
  distance_km?: number;
}

interface DriverScore {
  distance_km: number;
  score: number;
  estimated_arrival: number;
  compatibility: number;
}

export const useIntelligentOrderDispatch = () => {
  const { user } = useAuth();
  const [pendingOrders, setPendingOrders] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Calculer le score intelligent pour un chauffeur
  const calculateDriverScore = useCallback((
    order: OrderRequest,
    driverLocation: { lat: number; lng: number },
    driverRating: number = 4.0,
    totalRides: number = 0
  ): DriverScore => {
    const pickupLat = order.pickup_coordinates?.lat || 0;
    const pickupLng = order.pickup_coordinates?.lng || 0;
    
    // Calcul de la distance (formule Haversine simplifiée)
    const distance_km = Math.sqrt(
      Math.pow((pickupLat - driverLocation.lat) * 111, 2) + 
      Math.pow((pickupLng - driverLocation.lng) * 111, 2)
    );

    // Score basé sur multiple critères
    const proximityScore = Math.max(0, 100 - (distance_km * 10)); // Plus proche = meilleur
    const ratingScore = (driverRating / 5) * 100; // Note sur 5
    const experienceScore = Math.min(100, totalRides * 2); // Expérience
    const priorityBonus = order.priority === 'urgent' ? 20 : order.priority === 'high' ? 10 : 0;

    const totalScore = (
      proximityScore * 0.4 +  // 40% proximité
      ratingScore * 0.3 +     // 30% rating
      experienceScore * 0.2 + // 20% expérience  
      priorityBonus * 0.1     // 10% priorité
    );

    const estimatedArrival = Math.ceil(distance_km * 2); // 2 min par km
    const compatibility = order.type === 'marketplace' ? 95 : 90; // Marketplace privilégiée

    return {
      distance_km,
      score: totalScore,
      estimated_arrival: estimatedArrival,
      compatibility
    };
  }, []);

  // Écouter les nouvelles commandes en temps réel
  useEffect(() => {
    if (!user || !isListening) return;

    console.log('🚀 Démarrage écoute intelligente des commandes...');

    const channels = [
      // Transport bookings
      supabase
        .channel('transport_bookings_channel')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'transport_bookings' },
          (payload) => {
            const newOrder: OrderRequest = {
              id: payload.new.id,
              type: 'taxi',
              pickup_location: payload.new.pickup_location,
              delivery_location: payload.new.delivery_location,
              pickup_coordinates: payload.new.pickup_coordinates,
              delivery_coordinates: payload.new.delivery_coordinates,
              estimated_price: payload.new.estimated_price || 0,
              priority: 'normal',
              created_at: payload.new.created_at,
              customer_id: payload.new.user_id,
              distance_km: payload.new.distance_km
            };
            
            console.log('📋 Nouvelle course taxi reçue:', newOrder);
            setPendingOrders(prev => [...prev, newOrder]);
            
            // Notification sonore et visuelle
            toast.success('Nouvelle course disponible!', {
              description: `De ${newOrder.pickup_location}`,
              duration: 10000
            });
          }
        ),

      // Delivery orders  
      supabase
        .channel('delivery_orders_channel')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'delivery_orders' },
          (payload) => {
            const newOrder: OrderRequest = {
              id: payload.new.id,
              type: 'delivery',
              pickup_location: payload.new.pickup_location,
              delivery_location: payload.new.delivery_location,
              pickup_coordinates: payload.new.pickup_coordinates,
              delivery_coordinates: payload.new.delivery_coordinates,
              estimated_price: payload.new.estimated_price || 0,
              priority: payload.new.delivery_type === 'flash' ? 'urgent' : 'normal',
              created_at: payload.new.created_at,
              customer_id: payload.new.user_id,
              special_requirements: payload.new.driver_notes
            };
            
            console.log('📦 Nouvelle livraison reçue:', newOrder);
            setPendingOrders(prev => [...prev, newOrder]);
            
            toast.success('Nouvelle livraison disponible!', {
              description: `${newOrder.delivery_location}`,
              duration: 10000
            });
          }
        ),

      // Marketplace delivery assignments
      supabase
        .channel('marketplace_assignments_channel')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'marketplace_delivery_assignments' },
          async (payload) => {
            // Récupérer les détails de la commande marketplace
            const { data: orderData } = await supabase
              .from('marketplace_orders')
              .select('*')
              .eq('id', payload.new.order_id)
              .single();

            if (orderData) {
              const newOrder: OrderRequest = {
                id: payload.new.id,
                type: 'marketplace',
                pickup_location: payload.new.pickup_address || 'Collecte vendeur',
                delivery_location: payload.new.delivery_address || 'Livraison client',
                pickup_coordinates: payload.new.pickup_coordinates,
                delivery_coordinates: payload.new.delivery_coordinates,
                estimated_price: payload.new.delivery_fee || 0,
                priority: 'high', // Marketplace prioritaire
                created_at: payload.new.created_at,
                customer_id: orderData.buyer_id,
                special_requirements: payload.new.special_requirements,
                distance_km: payload.new.distance_km
              };
              
              console.log('🛒 Nouvelle livraison marketplace reçue:', newOrder);
              setPendingOrders(prev => [...prev, newOrder]);
              
              toast.success('Nouvelle livraison marketplace!', {
                description: `Gains majorés: ${newOrder.estimated_price} CDF`,
                duration: 10000
              });
            }
          }
        )
    ];

    // Souscrire aux channels
    channels.forEach(channel => channel.subscribe());

    return () => {
      console.log('🔌 Arrêt écoute des commandes');
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, isListening]);

  // Accepter une commande
  const acceptOrder = useCallback(async (order: OrderRequest): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      let updateResult;
      
      switch (order.type) {
        case 'taxi':
          updateResult = await supabase
            .from('transport_bookings')
            .update({
              driver_id: user.id,
              status: 'driver_assigned',
              driver_assigned_at: new Date().toISOString()
            })
            .eq('id', order.id);
          break;
          
        case 'delivery':
          updateResult = await supabase
            .from('delivery_orders')
            .update({
              driver_id: user.id,
              status: 'driver_assigned',
              driver_assigned_at: new Date().toISOString()
            })
            .eq('id', order.id);
          break;
          
        case 'marketplace':
          updateResult = await supabase
            .from('marketplace_delivery_assignments')
            .update({
              driver_id: user.id,
              status: 'assigned'
            })
            .eq('id', order.id);
          break;
      }

      if (updateResult?.error) {
        toast.error('Erreur lors de l\'acceptation de la commande');
        return false;
      }

      // Retirer la commande des ordres en attente
      setPendingOrders(prev => prev.filter(o => o.id !== order.id));
      
      // Mettre le chauffeur comme non disponible
      await supabase
        .from('driver_locations')
        .update({ is_available: false })
        .eq('driver_id', user.id);

      toast.success('Commande acceptée avec succès!');
      return true;
      
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Erreur lors de l\'acceptation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refuser une commande
  const rejectOrder = useCallback((orderId: string) => {
    setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    toast.info('Commande refusée');
  }, []);

  // Démarrer/arrêter l'écoute des commandes
  const toggleListening = useCallback((listening: boolean) => {
    setIsListening(listening);
    if (listening) {
      toast.success('Écoute des commandes activée');
    } else {
      toast.info('Écoute des commandes désactivée');
      setPendingOrders([]);
    }
  }, []);

  return {
    pendingOrders,
    loading,
    isListening,
    acceptOrder,
    rejectOrder,
    toggleListening,
    calculateDriverScore
  };
};