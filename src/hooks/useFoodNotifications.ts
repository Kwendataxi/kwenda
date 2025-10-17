import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notificationSoundService } from '@/services/notificationSound';

export const useFoodNotifications = (restaurantId?: string) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !restaurantId) return;

    // Canal pour nouvelles commandes restaurant
    const ordersChannel = supabase
      .channel(`restaurant-orders-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'food_orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        async (payload) => {
          const order = payload.new;
          
          // 🔊 SON NOTIFICATION
          await notificationSoundService.playNotificationSound('newOrder');
          
          toast.success('🍽️ Nouvelle commande !', {
            description: `Commande #${order.order_number} - ${order.total_amount} CDF`,
            duration: 10000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'food_orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        async (payload) => {
          const order = payload.new;
          
          if (order.status === 'delivered') {
            // 🔊 SON SUCCÈS LIVRAISON
            await notificationSoundService.playNotificationSound('orderConfirmed');
            
            toast.success('✅ Commande livrée', {
              description: `#${order.order_number} confirmée`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [user, restaurantId]);
};
