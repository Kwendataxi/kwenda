/**
 * Hook pour gérer les notifications temps réel des chauffeurs/livreurs
 * Utilise Supabase Realtime pour des notifications instantanées
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { notificationSoundService } from '@/services/notificationSound';

interface DriverNotification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  created_at: string;
  metadata?: any;
  reference_id?: string;
}

export const useDriverNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    console.log('🔔 Initialisation notifications driver:', user.id);

    // Charger les notifications non lues
    const loadPendingNotifications = async () => {
      const { data, error } = await supabase
        .from('push_notifications')
        .select('*')
        .eq('user_id', user.id)
        .in('notification_type', ['ride_assignment', 'delivery_assignment'])
        .eq('is_sent', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur chargement notifications:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log(`✅ ${data.length} notifications en attente`);
        setNotifications(data);
        setUnreadCount(data.length);
      }
    };

    loadPendingNotifications();

    // S'abonner aux nouvelles notifications en temps réel
    const channel = supabase
      .channel(`driver-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'push_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotif = payload.new as DriverNotification;
          
          console.log('🔔 NOUVELLE NOTIFICATION:', newNotif);

          // Vérifier si c'est une notification de course/livraison
          if (
            newNotif.notification_type === 'ride_assignment' ||
            newNotif.notification_type === 'delivery_assignment'
          ) {
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Afficher toast avec son
            const isDelivery = newNotif.notification_type === 'delivery_assignment';
            toast.success(newNotif.title, {
              description: newNotif.message,
              duration: 120000, // 2 minutes
              icon: isDelivery ? '📦' : '🚗'
            });

            // Jouer un son + vibration
            notificationSoundService.playNotificationSound(
              isDelivery ? 'deliveryPicked' : 'driverAssigned'
            );

            // Notification native si permission accordée
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(newNotif.title, {
                body: newNotif.message,
                icon: '/logo.png',
                badge: '/logo.png',
                tag: `notification-${newNotif.id}`,
                requireInteraction: true
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime status:', status);
      });

    return () => {
      console.log('🔌 Déconnexion notifications realtime');
      supabase.removeChannel(channel);
    };
  }, [user]);


  // Marquer une notification comme lue
  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('push_notifications')
      .update({ 
        is_sent: true, 
        sent_at: new Date().toISOString() 
      })
      .eq('id', notificationId);

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Effacer toutes les notifications
  const clearAll = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('push_notifications')
      .update({ is_sent: true, sent_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_sent', false);

    if (!error) {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearAll
  };
};
