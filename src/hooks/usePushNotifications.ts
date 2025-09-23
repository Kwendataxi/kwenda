/**
 * Hook React pour les notifications push
 * Gère l'état, l'initialisation et les actions
 */

import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useToast } from '@/hooks/use-toast';

interface UsePushNotificationsState {
  isInitialized: boolean;
  hasPermission: boolean;
  isSupported: boolean;
  loading: boolean;
  error: string | null;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<UsePushNotificationsState>({
    isInitialized: false,
    hasPermission: false,
    isSupported: false,
    loading: false,
    error: null
  });

  const { toast } = useToast();

  /**
   * Initialiser les notifications push
   */
  const initialize = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Vérifier le support
      const isSupported = 'Notification' in window || 
        (typeof window !== 'undefined' && 
         typeof (window as any).Capacitor !== 'undefined');

      if (!isSupported) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          isSupported: false,
          error: 'Notifications push non supportées sur cet appareil'
        }));
        return false;
      }

      // Initialiser le service
      const initialized = await pushNotificationService.initialize();
      
      // Vérifier les permissions
      let hasPermission = false;
      if ('Notification' in window) {
        hasPermission = Notification.permission === 'granted';
      }

      setState(prev => ({
        ...prev,
        isInitialized: initialized,
        hasPermission,
        isSupported: true,
        loading: false,
        error: initialized ? null : 'Échec de l\'initialisation'
      }));

      if (initialized) {
        console.log('✅ Notifications push initialisées');
        toast({
          title: "Notifications activées",
          description: "Vous recevrez maintenant les notifications push.",
        });
      }

      return initialized;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      toast({
        title: "Erreur d'initialisation",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }
  }, [toast]);

  /**
   * Envoyer une notification de test
   */
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const success = await pushNotificationService.sendTestNotification();
      
      setState(prev => ({ ...prev, loading: false }));
      
      if (success) {
        toast({
          title: "Test envoyé",
          description: "Une notification de test a été envoyée.",
        });
      } else {
        toast({
          title: "Échec du test",
          description: "Impossible d'envoyer la notification de test.",
          variant: "destructive",
        });
      }
      
      return success;
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi du test.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [toast]);

  /**
   * Envoyer une notification personnalisée
   */
  const sendNotification = useCallback(async (payload: {
    type: string;
    recipients: string[];
    title: string;
    body: string;
    data?: Record<string, any>;
    priority?: string;
    send_immediately?: boolean;
  }): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const result = await pushNotificationService.sendNotification(payload);
      
      setState(prev => ({ ...prev, loading: false }));
      
      if (result.success) {
        toast({
          title: "Notification envoyée",
          description: `Notification envoyée à ${payload.recipients.length} destinataire(s).`,
        });
      } else {
        toast({
          title: "Échec d'envoi",
          description: result.error || "Erreur lors de l'envoi.",
          variant: "destructive",
        });
      }
      
      return result.success;
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi de la notification.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [toast]);

  /**
   * Désactiver les notifications
   */
  const disableNotifications = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const success = await pushNotificationService.disableNotifications();
      
      setState(prev => ({ 
        ...prev, 
        loading: false,
        hasPermission: !success
      }));
      
      if (success) {
        toast({
          title: "Notifications désactivées",
          description: "Vous ne recevrez plus de notifications push.",
        });
      }
      
      return success;
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      
      toast({
        title: "Erreur",
        description: "Impossible de désactiver les notifications.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [toast]);

  /**
   * Obtenir le statut des notifications
   */
  const getStatus = useCallback(async () => {
    try {
      const status = await pushNotificationService.getNotificationStatus();
      return status;
    } catch (error) {
      console.error('Erreur récupération statut:', error);
      return null;
    }
  }, []);

  /**
   * Écouter les notifications reçues
   */
  useEffect(() => {
    const handleNotificationReceived = (event: any) => {
      const notification = event.detail;
      
      toast({
        title: notification.title || "Nouvelle notification",
        description: notification.body || "Vous avez reçu une notification.",
      });
    };

    window.addEventListener('push-notification-received', handleNotificationReceived);
    
    return () => {
      window.removeEventListener('push-notification-received', handleNotificationReceived);
    };
  }, [toast]);

  /**
   * Initialisation automatique
   */
  useEffect(() => {
    if (!state.isInitialized && !state.loading) {
      initialize();
    }
  }, [initialize, state.isInitialized, state.loading]);

  return {
    // État
    ...state,
    
    // Actions
    initialize,
    sendTestNotification,
    sendNotification,
    disableNotifications,
    getStatus,
    
    // Helpers
    canSendNotifications: state.isInitialized && state.hasPermission,
    needsPermission: state.isSupported && !state.hasPermission
  };
};