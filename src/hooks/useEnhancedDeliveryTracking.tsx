import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeliveryTrackingState {
  order: any;
  statusHistory: any[];
  driverLocation: any;
  driverProfile: any;
  recipientProfile: any;
  notifications: any[];
  loading: boolean;
  error: string | null;
}

interface NotificationPreferences {
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
}

export const useEnhancedDeliveryTracking = (orderId: string) => {
  const [state, setState] = useState<DeliveryTrackingState>({
    order: null,
    statusHistory: [],
    driverLocation: null,
    driverProfile: null,
    recipientProfile: null,
    notifications: [],
    loading: false,
    error: null
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    pushEnabled: true,
    smsEnabled: false,
    emailEnabled: true
  });

  // Load initial data
  const loadTrackingData = useCallback(async () => {
    if (!orderId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Load order details
      const { data: order, error: orderError } = await supabase
        .from('delivery_orders')
        .select(`
          *,
          sender:clients!delivery_orders_sender_id_fkey(
            id, display_name, phone_number, email
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Load status history
      const { data: statusHistory, error: historyError } = await supabase
        .from('delivery_status_history')
        .select('*')
        .eq('delivery_order_id', orderId)
        .order('changed_at', { ascending: true });

      if (historyError) throw historyError;

      // Load driver profile if assigned
      let driverProfile = null;
      if (order?.driver_id) {
        const { data: driver, error: driverError } = await supabase
          .from('chauffeurs')
          .select(`
            id, display_name, phone_number, email, 
            rating, vehicle_type, vehicle_model, license_plate
          `)
          .eq('id', order.driver_id)
          .single();

        if (!driverError) driverProfile = driver;
      }

      // Load recipient profile from delivery order data
      let recipientProfile = null;
      if (order?.delivery_location) {
        recipientProfile = {
          display_name: 'Destinataire',
          phone_number: null,
          email: null
        };
      }

      // Load driver location if driver assigned
      let driverLocation = null;
      if (order?.driver_id) {
        const { data: location, error: locationError } = await supabase
          .from('driver_locations')
          .select('*')
          .eq('driver_id', order.driver_id)
          .single();

        if (!locationError) driverLocation = location;
      }

      // ✅ TOUJOURS retourner l'order même sans chauffeur
      setState(prev => ({
        ...prev,
        order: order || null, // S'assurer que order est défini
        statusHistory: statusHistory || [],
        driverProfile: driverProfile || null,
        recipientProfile,
        driverLocation: driverLocation || null,
        loading: false,
        error: null // Clear error si succès
      }));

    } catch (error: any) {
      console.error('Error loading tracking data:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Erreur lors du chargement',
        loading: false
      }));
    }
  }, [orderId]);

  // Real-time subscriptions
  useEffect(() => {
    if (!orderId) return;

    // Subscribe to order updates
    const orderChannel = supabase
      .channel(`delivery-order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'delivery_orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        setState(prev => ({
          ...prev,
          order: { ...prev.order, ...payload.new }
        }));

        // Show notification for status changes
        if (payload.old?.status !== payload.new?.status) {
          showStatusNotification(payload.new.status);
        }
      })
      .subscribe();

    // Subscribe to status history updates
    const historyChannel = supabase
      .channel(`delivery-history-${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'delivery_status_history',
        filter: `delivery_order_id=eq.${orderId}`
      }, (payload) => {
        setState(prev => ({
          ...prev,
          statusHistory: [...prev.statusHistory, payload.new]
        }));

        // Add to notifications
        addNotification({
          type: 'status_update',
          title: getStatusLabel(payload.new.status),
          message: payload.new.notes || getStatusDescription(payload.new.status),
          timestamp: payload.new.changed_at
        });
      })
      .subscribe();

    // Subscribe to driver location updates
    const locationChannel = supabase
      .channel(`driver-location-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'driver_locations',
        filter: `driver_id=eq.${state.order?.driver_id}`
      }, (payload) => {
        setState(prev => ({
          ...prev,
          driverLocation: payload.new
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(historyChannel);
      supabase.removeChannel(locationChannel);
    };
  }, [orderId, state.order?.driver_id]);

  // Load data on mount
  useEffect(() => {
    loadTrackingData();
  }, [loadTrackingData]);

  // Notification functions
  const showStatusNotification = (status: string) => {
    const statusLabels = {
      confirmed: 'Commande confirmée',
      driver_assigned: 'Chauffeur assigné',
      picked_up: 'Colis récupéré',
      in_transit: 'En cours de livraison',
      delivered: 'Livraison terminée',
      cancelled: 'Commande annulée'
    };

    const title = statusLabels[status as keyof typeof statusLabels] || 'Mise à jour';
    
    if (notificationPrefs.pushEnabled) {
      toast.success(title, {
        description: `Votre commande #${orderId.slice(-8)} a été mise à jour`
      });
    }

    // Send push notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Kwenda Delivery - ${title}`, {
        body: `Commande #${orderId.slice(-8)}`,
        icon: '/favicon.ico'
      });
    }
  };

  const addNotification = (notification: any) => {
    setState(prev => ({
      ...prev,
      notifications: [
        {
          id: Date.now().toString(),
          ...notification,
          read: false
        },
        ...prev.notifications.slice(0, 49) // Keep last 50 notifications
      ]
    }));
  };

  const markNotificationAsRead = (notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    }));
  };

  const clearNotifications = () => {
    setState(prev => ({ ...prev, notifications: [] }));
  };

  // Helper functions
  const getStatusLabel = (status: string): string => {
    const statusLabels = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      driver_assigned: 'Chauffeur assigné',
      picked_up: 'Colis récupéré',
      in_transit: 'En cours de livraison',
      delivered: 'Livré',
      cancelled: 'Annulé'
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
  };

  const getStatusDescription = (status: string): string => {
    const descriptions = {
      pending: 'Votre commande est en cours de traitement',
      confirmed: 'Recherche d\'un chauffeur disponible',
      driver_assigned: 'Un chauffeur a été assigné à votre livraison',
      picked_up: 'Le chauffeur a récupéré votre colis',
      in_transit: 'Votre colis est en route vers sa destination',
      delivered: 'Livraison terminée avec succès',
      cancelled: 'Commande annulée'
    };
    return descriptions[status as keyof typeof descriptions] || '';
  };

  const calculateETA = (): string | null => {
    if (!state.driverLocation || !state.order) return null;

    // Simple ETA calculation based on distance and average speed
    // In real implementation, you'd use Google Maps API
    const estimatedMinutes = 15; // Placeholder
    const eta = new Date(Date.now() + estimatedMinutes * 60 * 1000);
    
    return eta.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeliveryProgress = (): number => {
    if (!state.order) return 0;

    const progressMap = {
      pending: 10,
      confirmed: 25,
      driver_assigned: 40,
      picked_up: 60,
      in_transit: 80,
      delivered: 100,
      cancelled: 0
    };

    return progressMap[state.order.status as keyof typeof progressMap] || 0;
  };

  // Contact functions
  const contactDriver = () => {
    if (state.driverProfile?.phone_number) {
      window.open(`tel:${state.driverProfile.phone_number}`, '_self');
    }
  };

  const contactSupport = () => {
    // Implement support contact logic
    toast.info('Support disponible 24h/7j au +243 XXX XXX XXX');
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPrefs(prev => ({
        ...prev,
        pushEnabled: permission === 'granted'
      }));
    }
  };

  return {
    // State
    ...state,
    notificationPrefs,
    
    // Computed values
    statusLabel: state.order ? getStatusLabel(state.order.status) : '',
    estimatedArrival: calculateETA(),
    deliveryProgress: getDeliveryProgress(),
    unreadNotifications: state.notifications.filter(n => !n.read).length,
    
    // Actions
    refreshTracking: loadTrackingData,
    markNotificationAsRead,
    clearNotifications,
    contactDriver,
    contactSupport,
    requestNotificationPermission,
    
    // Preference updates
    updateNotificationPrefs: setNotificationPrefs
  };
}