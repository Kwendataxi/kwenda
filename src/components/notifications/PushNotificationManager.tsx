import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const PushNotificationManager = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to transport booking updates
    const transportChannel = supabase
      .channel('transport-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transport_bookings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const { status, driver_id } = payload.new;
          
          if (status === 'driver_assigned' && driver_id) {
            toast.success('🚗 Chauffeur assigné !', {
              description: 'Votre chauffeur est en route vers vous',
              action: {
                label: 'Suivre',
                onClick: () => window.location.href = '/transport/tracking'
              }
            });
          } else if (status === 'driver_arrived') {
            toast.info('📍 Chauffeur arrivé', {
              description: 'Votre chauffeur est à votre emplacement'
            });
          } else if (status === 'in_progress') {
            toast.success('🏁 Course démarrée', {
              description: 'Bonne route !'
            });
          } else if (status === 'completed') {
            toast.success('✅ Course terminée', {
              description: 'Merci d\'avoir utilisé Kwenda !',
              action: {
                label: 'Noter',
                onClick: () => window.location.href = '/transport/rating'
              }
            });
          }
        }
      )
      .subscribe();

    // Subscribe to delivery order updates
    const deliveryChannel = supabase
      .channel('delivery-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const { status } = payload.new;
          
          if (status === 'confirmed') {
            toast.success('📦 Commande confirmée', {
              description: 'Votre livraison est en cours de préparation'
            });
          } else if (status === 'driver_assigned') {
            toast.info('🚴 Livreur assigné', {
              description: 'Un livreur va récupérer votre colis'
            });
          } else if (status === 'picked_up') {
            toast.success('📫 Colis récupéré', {
              description: 'Le livreur est en route vers la destination',
              action: {
                label: 'Suivre',
                onClick: () => window.location.href = '/delivery/tracking'
              }
            });
          } else if (status === 'in_transit') {
            toast.info('🛣️ En cours de livraison', {
              description: 'Votre colis arrive bientôt'
            });
          } else if (status === 'delivered') {
            toast.success('🎉 Livraison réussie !', {
              description: 'Votre colis a été livré',
              action: {
                label: 'Voir preuve',
                onClick: () => window.location.href = '/delivery/proof'
              }
            });
          }
        }
      )
      .subscribe();

    // Subscribe to marketplace order updates
    const marketplaceChannel = supabase
      .channel('marketplace-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'marketplace_orders',
          filter: `buyer_id=eq.${user.id}`
        },
        (payload) => {
          const { status } = payload.new;
          
          if (status === 'confirmed') {
            toast.success('🛍️ Commande acceptée', {
              description: 'Le vendeur a accepté votre commande'
            });
          } else if (status === 'shipped') {
            toast.info('📮 Commande expédiée', {
              description: 'Votre article est en route',
              action: {
                label: 'Suivre',
                onClick: () => window.location.href = '/marketplace/tracking'
              }
            });
          } else if (status === 'delivered') {
            toast.success('✅ Commande livrée', {
              description: 'Profitez de votre achat !',
              action: {
                label: 'Noter',
                onClick: () => window.location.href = '/marketplace/rating'
              }
            });
          }
        }
      )
      .subscribe();

    // Subscribe to restaurant food orders
    const foodChannel = supabase
      .channel('food-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'food_orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const { status } = payload.new;
          
          if (status === 'confirmed') {
            toast.success('🍽️ Commande confirmée', {
              description: 'Le restaurant prépare votre commande'
            });
          } else if (status === 'preparing') {
            toast.info('👨‍🍳 En cours de préparation', {
              description: 'Votre repas est en cours de préparation'
            });
          } else if (status === 'ready') {
            toast.success('✅ Commande prête', {
              description: 'Votre commande est prête à être récupérée ou livrée'
            });
          } else if (status === 'out_for_delivery') {
            toast.info('🚗 En cours de livraison', {
              description: 'Votre commande arrive !',
              action: {
                label: 'Suivre',
                onClick: () => window.location.href = '/food/tracking'
              }
            });
          } else if (status === 'delivered') {
            toast.success('🎉 Bon appétit !', {
              description: 'Votre commande a été livrée',
              action: {
                label: 'Noter',
                onClick: () => window.location.href = '/food/rating'
              }
            });
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(transportChannel);
      supabase.removeChannel(deliveryChannel);
      supabase.removeChannel(marketplaceChannel);
      supabase.removeChannel(foodChannel);
    };
  }, [user]);

  return null; // This is a headless component
};
