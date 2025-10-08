import { useState, useEffect, useCallback } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PushNotificationState {
  isRegistered: boolean;
  token: string | null;
  error: string | null;
  permissionGranted: boolean;
}

/**
 * Hook pour gérer les notifications push natives sur mobile (iOS/Android)
 * Utilise @capacitor/push-notifications pour FCM/APNS
 */
export const useCapacitorPushNotifications = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isRegistered: false,
    token: null,
    error: null,
    permissionGranted: false
  });

  const isMobile = Capacitor.isNativePlatform();

  // Enregistrer le token FCM/APNS dans Supabase
  const registerToken = useCallback(async (token: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('push_notification_tokens')
        .upsert({
          user_id: user.id,
          token,
          platform: Capacitor.getPlatform(),
          device_info: {
            model: await getDeviceInfo(),
            platform: Capacitor.getPlatform()
          },
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,token' });

      if (error) {
        console.error('Error saving push token:', error);
        setState(prev => ({ ...prev, error: error.message }));
      } else {
        console.log('✅ Push token registered:', token);
        setState(prev => ({ ...prev, isRegistered: true, token, error: null }));
      }
    } catch (err) {
      console.error('Error in registerToken:', err);
      setState(prev => ({ ...prev, error: 'Failed to register token' }));
    }
  }, [user]);

  // Obtenir les infos du device
  const getDeviceInfo = async () => {
    try {
      const { Device } = await import('@capacitor/device');
      const info = await Device.getInfo();
      return {
        model: info.model,
        platform: info.platform,
        osVersion: info.osVersion,
        manufacturer: info.manufacturer
      };
    } catch {
      return { model: 'unknown', platform: Capacitor.getPlatform() };
    }
  };

  // Initialiser les notifications push
  const initializePushNotifications = useCallback(async () => {
    if (!isMobile) {
      console.log('⚠️ Push notifications only available on mobile');
      return;
    }

    try {
      // 1. Demander les permissions
      const permResult = await PushNotifications.requestPermissions();
      
      if (permResult.receive === 'granted') {
        setState(prev => ({ ...prev, permissionGranted: true }));
        
        // 2. Enregistrer avec FCM/APNS
        await PushNotifications.register();
        
        console.log('✅ Push notifications initialized');
      } else {
        setState(prev => ({ 
          ...prev, 
          permissionGranted: false,
          error: 'Permission denied by user' 
        }));
        
        toast.error('Notifications refusées', {
          description: 'Activez les notifications dans les paramètres de votre appareil'
        });
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      setState(prev => ({ ...prev, error: String(error) }));
      
      toast.error('Erreur de notification', {
        description: 'Impossible d\'initialiser les notifications push'
      });
    }
  }, [isMobile]);

  // Listeners pour les événements push
  useEffect(() => {
    if (!isMobile) return;

    let registrationListener: any;
    let registrationErrorListener: any;
    let notificationReceivedListener: any;
    let notificationActionListener: any;

    const setupListeners = async () => {
      // Registration success - FCM/APNS token reçu
      registrationListener = await PushNotifications.addListener('registration', (token: Token) => {
        console.log('📱 Push registration success:', token.value);
        registerToken(token.value);
      });

      // Registration error
      registrationErrorListener = await PushNotifications.addListener('registrationError', (error: any) => {
        console.error('❌ Push registration error:', error);
        setState(prev => ({ 
          ...prev, 
          error: error.error || 'Registration failed',
          isRegistered: false 
        }));
      });

      // Notification reçue (app en foreground)
      notificationReceivedListener = await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          console.log('📩 Push notification received:', notification);
          
          toast.info(notification.title || 'Nouvelle notification', {
            description: notification.body,
            duration: 4000
          });
        }
      );

      // Notification cliquée (app en background)
      notificationActionListener = await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action: ActionPerformed) => {
          console.log('🔔 Push notification action:', action);
          
          const notification = action.notification;
          const data = notification.data;
          
          // Navigation basée sur les données de la notification
          if (data?.url) {
            window.location.href = data.url;
          }
          
          toast.success('Notification ouverte', {
            description: notification.body
          });
        }
      );
    };

    setupListeners();

    return () => {
      if (registrationListener) registrationListener.remove();
      if (registrationErrorListener) registrationErrorListener.remove();
      if (notificationReceivedListener) notificationReceivedListener.remove();
      if (notificationActionListener) notificationActionListener.remove();
    };
  }, [isMobile, registerToken]);

  // Auto-initialiser si user est connecté
  useEffect(() => {
    if (isMobile && user && !state.isRegistered) {
      initializePushNotifications();
    }
  }, [isMobile, user, state.isRegistered, initializePushNotifications]);

  // Obtenir les notifications en attente
  const getDeliveredNotifications = useCallback(async () => {
    if (!isMobile) return [];
    
    try {
      const result = await PushNotifications.getDeliveredNotifications();
      return result.notifications;
    } catch (error) {
      console.error('Error getting delivered notifications:', error);
      return [];
    }
  }, [isMobile]);

  // Supprimer toutes les notifications
  const removeAllDeliveredNotifications = useCallback(async () => {
    if (!isMobile) return;
    
    try {
      await PushNotifications.removeAllDeliveredNotifications();
      console.log('✅ All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, [isMobile]);

  return {
    ...state,
    isMobile,
    initializePushNotifications,
    getDeliveredNotifications,
    removeAllDeliveredNotifications,
    isSupported: isMobile
  };
};
