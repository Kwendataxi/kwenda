/**
 * 🔔 PHASE 7: Service de Notifications Robuste pour Chauffeurs
 * Multi-channel + polling fallback + notifications natives
 * IMPOSSIBLE DE RATER UNE COURSE
 */

import { supabase } from '@/integrations/supabase/client';
import { LocalNotifications } from '@capacitor/local-notifications';
import { driverHaptics } from '@/utils/driverHaptics';

interface NotificationCallback {
  (notification: DriverNotification): void;
}

interface DriverNotification {
  id: string;
  type: 'taxi' | 'delivery' | 'marketplace';
  orderId: string;
  title: string;
  message: string;
  data: any;
  timestamp: number;
}

class DriverNotificationService {
  private channels: any[] = [];
  private callbacks: NotificationCallback[] = [];
  private lastNotificationTime: number = Date.now();
  private pollingInterval: NodeJS.Timeout | null = null;
  private isActive = false;

  /**
   * Démarrer le service multi-channel
   */
  async start(driverId: string): Promise<void> {
    if (this.isActive) {
      console.log('🔔 Notification service already active');
      return;
    }

    this.isActive = true;
    console.log('🔔 Starting notification service');

    // 1️⃣ Channel Realtime Transport
    const transportChannel = supabase
      .channel('driver-transport-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transport_bookings',
          filter: `status=eq.pending`
        },
        (payload) => {
          console.log('📢 Transport notification:', payload);
          this.handleTransportNotification(payload);
        }
      )
      .subscribe();

    this.channels.push(transportChannel);

    // 2️⃣ Channel Realtime Delivery
    const deliveryChannel = supabase
      .channel('driver-delivery-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_orders'
        },
        (payload) => {
          console.log('📦 Delivery notification:', payload);
          this.handleDeliveryNotification(payload);
        }
      )
      .subscribe();

    this.channels.push(deliveryChannel);

    // 3️⃣ Channel Realtime Marketplace
    const marketplaceChannel = supabase
      .channel('driver-marketplace-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_delivery_assignments',
          filter: `driver_id=eq.${driverId}`
        },
        (payload) => {
          console.log('🛍️ Marketplace notification:', payload);
          this.handleMarketplaceNotification(payload);
        }
      )
      .subscribe();

    this.channels.push(marketplaceChannel);

    // 4️⃣ POLLING FALLBACK (toutes les 30 secondes)
    this.startPolling(driverId);

    // 5️⃣ Demander permissions notifications natives
    await this.requestNotificationPermissions();
  }

  /**
   * Arrêter le service
   */
  async stop(): Promise<void> {
    this.isActive = false;

    // Unsubscribe tous les channels
    for (const channel of this.channels) {
      await supabase.removeChannel(channel);
    }
    this.channels = [];

    // Arrêter polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    console.log('🔕 Notification service stopped');
  }

  /**
   * S'abonner aux notifications
   */
  subscribe(callback: NotificationCallback): () => void {
    this.callbacks.push(callback);

    // Retourner fonction de désinscription
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Polling de secours (si realtime échoue)
   */
  private startPolling(driverId: string): void {
    this.pollingInterval = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastNotif = now - this.lastNotificationTime;

      // Si pas de notification depuis 2 minutes, checker manuellement
      if (timeSinceLastNotif > 2 * 60 * 1000) {
        console.log('⚠️ Polling fallback: checking for pending orders');
        await this.checkPendingOrders(driverId);
      }
    }, 30000); // Toutes les 30 secondes
  }

  /**
   * Checker manuellement les commandes en attente
   */
  private async checkPendingOrders(driverId: string): Promise<void> {
    try {
      // Checker transport
      const { data: transports } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('status', 'pending')
        .is('driver_id', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (transports && transports.length > 0) {
        console.log('📍 Found pending transport orders:', transports.length);
        transports.forEach(order => {
          this.emitNotification({
            id: `transport-${order.id}`,
            type: 'taxi',
            orderId: order.id,
            title: '🚗 Nouvelle course disponible',
            message: `${order.pickup_location} → ${order.destination}`,
            data: order,
            timestamp: Date.now()
          });
        });
      }

      // Checker deliveries
      const { data: deliveries } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('status', 'pending')
        .is('driver_id', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (deliveries && deliveries.length > 0) {
        console.log('📦 Found pending delivery orders:', deliveries.length);
        deliveries.forEach(order => {
          this.emitNotification({
            id: `delivery-${order.id}`,
            type: 'delivery',
            orderId: order.id,
            title: '📦 Nouvelle livraison disponible',
            message: `${order.pickup_location} → ${order.delivery_location}`,
            data: order,
            timestamp: Date.now()
          });
        });
      }
    } catch (error) {
      console.error('❌ Error checking pending orders:', error);
    }
  }

  /**
   * Gérer notification transport
   */
  private handleTransportNotification(payload: any): void {
    const order = payload.new;
    
    this.emitNotification({
      id: `transport-${order.id}`,
      type: 'taxi',
      orderId: order.id,
      title: '🚗 Nouvelle course !',
      message: `${order.pickup_location} → ${order.destination}`,
      data: order,
      timestamp: Date.now()
    });
  }

  /**
   * Gérer notification delivery
   */
  private handleDeliveryNotification(payload: any): void {
    const order = payload.new;
    
    this.emitNotification({
      id: `delivery-${order.id}`,
      type: 'delivery',
      orderId: order.id,
      title: '📦 Nouvelle livraison !',
      message: `${order.pickup_location} → ${order.delivery_location}`,
      data: order,
      timestamp: Date.now()
    });
  }

  /**
   * Gérer notification marketplace
   */
  private handleMarketplaceNotification(payload: any): void {
    const assignment = payload.new;
    
    this.emitNotification({
      id: `marketplace-${assignment.id}`,
      type: 'marketplace',
      orderId: assignment.order_id,
      title: '🛍️ Livraison marketplace !',
      message: 'Nouvelle livraison assignée',
      data: assignment,
      timestamp: Date.now()
    });
  }

  /**
   * Émettre une notification vers tous les listeners
   */
  private emitNotification(notification: DriverNotification): void {
    this.lastNotificationTime = Date.now();

    // Callback vers React
    this.callbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('❌ Notification callback error:', error);
      }
    });

    // Notification native
    this.sendNativeNotification(notification);

    // Haptic feedback
    driverHaptics.onNewRide();
  }

  /**
   * Envoyer notification native (Capacitor)
   */
  private async sendNativeNotification(notification: DriverNotification): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: notification.title,
          body: notification.message,
          sound: 'default',
          extra: notification.data
        }]
      });
    } catch (error) {
      console.log('Native notification not available:', error);
    }
  }

  /**
   * Demander permissions notifications
   */
  private async requestNotificationPermissions(): Promise<void> {
    try {
      const result = await LocalNotifications.requestPermissions();
      console.log('📱 Notification permissions:', result);
    } catch (error) {
      console.log('Notification permissions not available:', error);
    }
  }
}

// Export singleton
export const driverNotificationService = new DriverNotificationService();
