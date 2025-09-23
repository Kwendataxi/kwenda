/**
 * Service de notifications push avec intégration Capacitor
 * Gère l'enregistrement des tokens, l'envoi et la réception de notifications
 */

import { supabase } from '@/integrations/supabase/client';

// Types pour les notifications
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  sound?: string;
  badge?: number;
  image?: string;
}

export interface NotificationToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  user_id: string;
  is_active: boolean;
}

export interface PushNotificationPermission {
  display: 'granted' | 'denied' | 'prompt';
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private isInitialized: boolean = false;
  private isCapacitorAvailable: boolean = false;
  private currentToken: string | null = null;

  static getInstance(): PushNotificationService {
    if (!this.instance) {
      this.instance = new PushNotificationService();
    }
    return this.instance;
  }

  constructor() {
    this.checkCapacitorAvailability();
  }

  private checkCapacitorAvailability(): void {
    try {
      this.isCapacitorAvailable = typeof window !== 'undefined' && 
        window.Capacitor !== undefined && 
        typeof window.Capacitor.isNativePlatform === 'function';
      
      console.log(`📱 Capacitor Push Notifications disponible: ${this.isCapacitorAvailable}`);
    } catch (error) {
      this.isCapacitorAvailable = false;
    }
  }

  /**
   * Initialiser le service de notifications push
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      if (this.isCapacitorAvailable) {
        await this.initializeCapacitor();
      } else {
        await this.initializeWeb();
      }

      this.isInitialized = true;
      console.log('📱 Push Notification Service initialisé');
      return true;
    } catch (error) {
      console.error('❌ Erreur initialisation push notifications:', error);
      return false;
    }
  }

  /**
   * Initialisation pour Capacitor (mobile natif)
   */
  private async initializeCapacitor(): Promise<void> {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      // Demander les permissions
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        // Enregistrer le device pour recevoir les notifications
        await PushNotifications.register();

        // Écouter l'enregistrement réussi
        PushNotifications.addListener('registration', async (token) => {
          console.log('📝 Push registration token:', token.value);
          this.currentToken = token.value;
          await this.saveTokenToDatabase(token.value, 'android'); // Détection platform à améliorer
        });

        // Écouter les erreurs d'enregistrement
        PushNotifications.addListener('registrationError', (error) => {
          console.error('❌ Push registration error:', error);
        });

        // Écouter les notifications reçues
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('📬 Notification reçue:', notification);
          this.handleNotificationReceived(notification);
        });

        // Écouter les actions sur les notifications
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('👆 Action notification:', action);
          this.handleNotificationAction(action);
        });

        console.log('📱 Capacitor Push Notifications configuré');
      } else {
        console.warn('⚠️ Permissions push notifications refusées');
      }
    } catch (error) {
      console.error('❌ Erreur configuration Capacitor:', error);
    }
  }

  /**
   * Initialisation pour le web (PWA)
   */
  private async initializeWeb(): Promise<void> {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        // Enregistrer le service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('📝 Service Worker enregistré:', registration);

        // Demander les permissions
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          // Obtenir le token de push
          const vapidKey = await this.getVapidKey();
          if (vapidKey) {
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: vapidKey
            });

            this.currentToken = JSON.stringify(subscription);
            await this.saveTokenToDatabase(this.currentToken, 'web');
            console.log('🌐 Web Push configuré');
          }
        } else {
          console.warn('⚠️ Permissions notification web refusées');
        }
      } else {
        console.warn('⚠️ Push notifications non supportées sur ce navigateur');
      }
    } catch (error) {
      console.error('❌ Erreur configuration web push:', error);
    }
  }

  /**
   * Obtenir la clé VAPID depuis Supabase
   */
  private async getVapidKey(): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('get-vapid-key');
      
      if (error) {
        console.error('Erreur récupération clé VAPID:', error);
        return null;
      }
      
      return data?.vapid_key || null;
    } catch (error) {
      console.error('Erreur appel fonction VAPID:', error);
      return null;
    }
  }

  /**
   * Sauvegarder le token dans la base de données
   */
  private async saveTokenToDatabase(token: string, platform: 'ios' | 'android' | 'web'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('⚠️ Utilisateur non connecté, token non sauvegardé');
        return;
      }

      // Désactiver les anciens tokens de cet utilisateur
      await supabase
        .from('push_notification_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('platform', platform);

      // Insérer le nouveau token
      const { error } = await supabase
        .from('push_notification_tokens')
        .upsert({
          user_id: user.id,
          token,
          platform,
          is_active: true
        });

      if (error) {
        console.error('❌ Erreur sauvegarde token:', error);
      } else {
        console.log('✅ Token push sauvegardé');
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde token:', error);
    }
  }

  /**
   * Gérer la réception d'une notification
   */
  private handleNotificationReceived(notification: any): void {
    // Émettre un événement personnalisé
    window.dispatchEvent(new CustomEvent('push-notification-received', {
      detail: notification
    }));

    // Log analytics
    this.logNotificationEvent('received', notification);
  }

  /**
   * Gérer l'action sur une notification
   */
  private handleNotificationAction(action: any): void {
    const { notification, actionId } = action;

    // Router selon le type de notification
    if (notification.data?.type) {
      this.handleNotificationNavigation(notification.data);
    }

    // Log analytics
    this.logNotificationEvent('action', { ...notification, actionId });
  }

  /**
   * Navigation basée sur le type de notification
   */
  private handleNotificationNavigation(data: any): void {
    const { type, order_id, booking_id, route } = data;

    switch (type) {
      case 'driver_assignment':
        if (booking_id) {
          window.location.href = `/driver/booking/${booking_id}`;
        }
        break;
      
      case 'order_update':
        if (order_id) {
          window.location.href = `/orders/${order_id}`;
        }
        break;
      
      case 'emergency':
        window.location.href = '/emergency';
        break;
      
      default:
        if (route) {
          window.location.href = route;
        }
        break;
    }
  }

  /**
   * Logger les événements de notification
   */
  private async logNotificationEvent(eventType: string, notification: any): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('push_notification_analytics')
          .insert({
            user_id: user.id,
            event_type: eventType,
            notification_data: notification,
            timestamp: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('❌ Erreur log notification:', error);
    }
  }

  /**
   * Envoyer une notification via l'Edge Function
   */
  async sendNotification(payload: {
    type: string;
    recipients: string[];
    title: string;
    body: string;
    data?: Record<string, any>;
    priority?: string;
    send_immediately?: boolean;
  }): Promise<{ success: boolean; queue_ids?: string[]; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('notification-dispatcher', {
        body: payload
      });

      if (error) {
        console.error('❌ Erreur envoi notification:', error);
        return { success: false, error: error.message };
      }

      console.log('📤 Notification envoyée:', data);
      return { success: true, queue_ids: data?.queue_ids };
    } catch (error) {
      console.error('❌ Erreur appel fonction:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }

  /**
   * Obtenir le statut des notifications
   */
  async getNotificationStatus(): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('notification-dispatcher/status');
      
      if (error) {
        console.error('❌ Erreur statut notifications:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('❌ Erreur appel statut:', error);
      return null;
    }
  }

  /**
   * Tester les notifications
   */
  async sendTestNotification(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('⚠️ Utilisateur non connecté');
      return false;
    }

    const result = await this.sendNotification({
      type: 'test',
      recipients: [user.id],
      title: '🧪 Notification de test',
      body: 'Votre système de notifications push fonctionne correctement !',
      data: { test: true },
      priority: 'normal',
      send_immediately: true
    });

    return result.success;
  }

  /**
   * Désactiver les notifications pour l'utilisateur actuel
   */
  async disableNotifications(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { error } = await supabase
        .from('push_notification_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Erreur désactivation notifications:', error);
        return false;
      }

      console.log('🔕 Notifications désactivées');
      return true;
    } catch (error) {
      console.error('❌ Erreur désactivation:', error);
      return false;
    }
  }
}

// Export singleton
export const pushNotificationService = PushNotificationService.getInstance();