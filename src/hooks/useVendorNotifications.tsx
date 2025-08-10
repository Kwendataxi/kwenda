import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { notificationSoundService } from '@/services/notificationSound';
import { useToast } from '@/hooks/use-toast';

interface VendorNotification {
  id: string;
  vendor_id: string;
  order_id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  is_acknowledged: boolean;
  sound_played: boolean;
  metadata: any;
  created_at: string;
  read_at?: string;
  acknowledged_at?: string;
}

interface UseVendorNotificationsReturn {
  notifications: VendorNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsAcknowledged: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useVendorNotifications(): UseVendorNotificationsReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vendor_notifications')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching vendor notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAsAcknowledged = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_notifications')
        .update({ 
          is_acknowledged: true, 
          acknowledged_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_acknowledged: true, acknowledged_at: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as acknowledged:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('vendor_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('vendor_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNewNotification = async (notification: VendorNotification) => {
    setNotifications(prev => [notification, ...prev]);
    
    // Play notification sound
    if (!notification.sound_played) {
      let soundType: 'newOrder' | 'orderConfirmed' | 'paymentReceived' | 'general' = 'general';
      
      switch (notification.notification_type) {
        case 'new_order':
          soundType = 'newOrder';
          break;
        case 'order_confirmed':
          soundType = 'orderConfirmed';
          break;
        case 'payment_received':
          soundType = 'paymentReceived';
          break;
      }
      
      await notificationSoundService.playNotificationSound(soundType);
      
      // Mark sound as played
      await supabase
        .from('vendor_notifications')
        .update({ sound_played: true })
        .eq('id', notification.id);
    }
    
    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
      duration: 5000,
    });
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('vendor-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vendor_notifications',
          filter: `vendor_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New vendor notification:', payload);
          handleNewNotification(payload.new as VendorNotification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vendor_notifications',
          filter: `vendor_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Updated vendor notification:', payload);
          setNotifications(prev =>
            prev.map(n =>
              n.id === payload.new.id ? payload.new as VendorNotification : n
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Preload notification sounds
  useEffect(() => {
    notificationSoundService.preloadSounds();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAsAcknowledged,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}