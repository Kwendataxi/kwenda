import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { notificationSoundService } from '@/services/notificationSound';
import { useToast } from '@/hooks/use-toast';

export type VendorNotificationType = 
  | 'new_order'
  | 'order_confirmed'
  | 'payment_received'
  | 'product_approved'
  | 'product_rejected'
  | 'product_flagged'
  | 'low_stock_alert'
  | 'review_received'
  | 'general';

export interface VendorNotification {
  id: string;
  vendor_id: string;
  user_id?: string;
  order_id?: string;
  notification_type: VendorNotificationType;
  type?: VendorNotificationType;
  title: string;
  message: string;
  priority?: string;
  is_read: boolean;
  is_acknowledged: boolean;
  sound_played: boolean;
  metadata: any;
  data?: any;
  created_at: string;
  read_at?: string;
  acknowledged_at?: string;
  requires_action?: boolean;
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
        .or(`vendor_id.eq.${user.id},user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications((data || []) as VendorNotification[]);
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
      const notifType = notification.type || notification.notification_type;
      
      // Enhanced sound mapping
      const soundMap: Record<VendorNotificationType, any> = {
        'new_order': 'newOrder',
        'order_confirmed': 'orderConfirmed',
        'payment_received': 'paymentReceived',
        'product_approved': 'productApproved',
        'product_rejected': 'productRejected',
        'product_flagged': 'productFlagged',
        'low_stock_alert': 'lowStockAlert',
        'review_received': 'reviewReceived',
        'general': 'general'
      };

      const soundType = soundMap[notifType] || 'general';
      await notificationSoundService.playNotificationSound(soundType);
      
      // Mark sound as played
      await supabase
        .from('vendor_notifications')
        .update({ sound_played: true })
        .eq('id', notification.id);
    }
    
    // Show toast notification with variant based on type
    const notifType = notification.type || notification.notification_type;
    const toastVariant = notifType === 'product_rejected' || notifType === 'product_flagged' 
      ? 'destructive' 
      : undefined;

    toast({
      title: notification.title,
      description: notification.message,
      duration: notification.priority === 'urgent' ? 8000 : 5000,
      variant: toastVariant,
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
          filter: `user_id=eq.${user.id}`,
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
          filter: `user_id=eq.${user.id}`,
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