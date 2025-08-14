import { supabase } from '@/integrations/supabase/client';

export interface OrderNotification {
  id: string;
  type: 'transport' | 'delivery' | 'marketplace';
  orderId: string;
  title: string;
  message: string;
  timestamp: Date;
  data: any;
  status: 'pending' | 'accepted' | 'expired';
}

class DriverOrderTracker {
  private static instance: DriverOrderTracker;
  private subscribers: ((notification: OrderNotification) => void)[] = [];
  private channels: any[] = [];
  private isListening = false;

  static getInstance(): DriverOrderTracker {
    if (!this.instance) {
      this.instance = new DriverOrderTracker();
    }
    return this.instance;
  }

  subscribe(callback: (notification: OrderNotification) => void) {
    this.subscribers.push(callback);
    
    if (!this.isListening) {
      this.startListening();
    }
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
      if (this.subscribers.length === 0) {
        this.stopListening();
      }
    };
  }

  private startListening() {
    this.isListening = true;
    console.log('🎧 Démarrage écoute des commandes chauffeur');

    // Écouter les nouvelles demandes de transport
    const rideChannel = supabase
      .channel('driver-ride-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_requests',
          filter: 'status=eq.dispatching'
        },
        (payload) => {
          console.log('🚗 Nouvelle demande transport:', payload.new);
          this.handleRideRequest(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_offers'
        },
        (payload) => {
          console.log('🎯 Nouvelle offre transport:', payload.new);
          this.handleRideOffer(payload.new);
        }
      )
      .subscribe();

    // Écouter les commandes de livraison
    const deliveryChannel = supabase
      .channel('driver-delivery-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_orders',
          filter: 'status=eq.pending'
        },
        (payload) => {
          console.log('📦 Nouvelle commande livraison:', payload.new);
          this.handleDeliveryOrder(payload.new);
        }
      )
      .subscribe();

    // Écouter les assignations marketplace
    const marketplaceChannel = supabase
      .channel('driver-marketplace-assignments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_delivery_assignments'
        },
        (payload) => {
          console.log('🛒 Nouvelle assignation marketplace:', payload.new);
          this.handleMarketplaceAssignment(payload.new);
        }
      )
      .subscribe();

    // Écouter les notifications push générales
    const notificationChannel = supabase
      .channel('driver-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'push_notifications'
        },
        (payload) => {
          console.log('🔔 Nouvelle notification:', payload.new);
          this.handlePushNotification(payload.new);
        }
      )
      .subscribe();

    this.channels = [rideChannel, deliveryChannel, marketplaceChannel, notificationChannel];
  }

  private stopListening() {
    this.isListening = false;
    console.log('🔇 Arrêt écoute des commandes');
    
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels = [];
  }

  private handleRideRequest(rideRequest: any) {
    const notification: OrderNotification = {
      id: `ride-${rideRequest.id}`,
      type: 'transport',
      orderId: rideRequest.id,
      title: 'Nouvelle course disponible',
      message: `Course vers ${rideRequest.destination} - ${rideRequest.surge_price || rideRequest.estimated_price} CDF`,
      timestamp: new Date(),
      data: rideRequest,
      status: 'pending'
    };

    this.notifySubscribers(notification);
  }

  private handleRideOffer(rideOffer: any) {
    // Vérifier si l'offre est pour ce chauffeur
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && rideOffer.driver_id === user.id) {
        // Récupérer les détails de la course
        supabase
          .from('ride_requests')
          .select('*')
          .eq('id', rideOffer.ride_request_id)
          .single()
          .then(({ data: rideRequest }) => {
            if (rideRequest) {
              const notification: OrderNotification = {
                id: `offer-${rideOffer.id}`,
                type: 'transport',
                orderId: rideRequest.id,
                title: '🎯 Course qui vous est proposée',
                message: `${rideRequest.pickup_location} → ${rideRequest.destination} - ${rideRequest.surge_price || rideRequest.estimated_price} CDF`,
                timestamp: new Date(),
                data: { ...rideRequest, offer_id: rideOffer.id },
                status: 'pending'
              };

              this.notifySubscribers(notification);
            }
          });
      }
    });
  }

  private handleDeliveryOrder(deliveryOrder: any) {
    const notification: OrderNotification = {
      id: `delivery-${deliveryOrder.id}`,
      type: 'delivery',
      orderId: deliveryOrder.id,
      title: `📦 Livraison ${deliveryOrder.delivery_mode?.toUpperCase()}`,
      message: `${deliveryOrder.pickup_location} → ${deliveryOrder.destination_location} - ${deliveryOrder.estimated_price} CDF`,
      timestamp: new Date(),
      data: deliveryOrder,
      status: 'pending'
    };

    this.notifySubscribers(notification);
  }

  private handleMarketplaceAssignment(assignment: any) {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && assignment.driver_id === user.id) {
        const notification: OrderNotification = {
          id: `marketplace-${assignment.id}`,
          type: 'marketplace',
          orderId: assignment.order_id,
          title: '🛒 Livraison Marketplace assignée',
          message: `${assignment.pickup_location} → ${assignment.delivery_location} - ${assignment.delivery_fee} CDF`,
          timestamp: new Date(),
          data: assignment,
          status: 'pending'
        };

        this.notifySubscribers(notification);
      }
    });
  }

  private handlePushNotification(pushNotification: any) {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && pushNotification.user_id === user.id) {
        const notification: OrderNotification = {
          id: `push-${pushNotification.id}`,
          type: pushNotification.notification_type?.includes('ride') ? 'transport' : 
                pushNotification.notification_type?.includes('delivery') ? 'delivery' : 'marketplace',
          orderId: pushNotification.reference_id || '',
          title: pushNotification.title,
          message: pushNotification.message,
          timestamp: new Date(),
          data: pushNotification,
          status: 'pending'
        };

        this.notifySubscribers(notification);
      }
    });
  }

  private notifySubscribers(notification: OrderNotification) {
    console.log('📢 Notification chauffeur:', notification);
    this.subscribers.forEach(callback => callback(notification));
  }

  // Méthodes pour accepter/rejeter des commandes
  async acceptRideOffer(rideRequestId: string, offerId?: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Non connecté');

      const { data, error } = await supabase.functions.invoke('ride-dispatcher', {
        body: {
          action: 'assign_driver',
          rideRequestId,
          driverId: user.user.id
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Erreur acceptation course:', error);
      return { success: false, error: error.message };
    }
  }

  async acceptDeliveryOrder(orderId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Non connecté');

      const { error } = await supabase
        .from('delivery_orders')
        .update({
          driver_id: user.user.id,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Marquer comme non disponible
      await supabase
        .from('driver_locations')
        .update({ is_available: false })
        .eq('driver_id', user.user.id);

      return { success: true };
    } catch (error: any) {
      console.error('Erreur acceptation livraison:', error);
      return { success: false, error: error.message };
    }
  }

  async acceptMarketplaceAssignment(assignmentId: string) {
    try {
      const { error } = await supabase
        .from('marketplace_delivery_assignments')
        .update({
          assignment_status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Erreur acceptation marketplace:', error);
      return { success: false, error: error.message };
    }
  }
}

export const driverOrderTracker = DriverOrderTracker.getInstance();