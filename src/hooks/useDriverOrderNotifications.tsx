/**
 * 🔔 Hook pour les Notifications Temps Réel des Chauffeurs
 * Subscribe aux alertes de livraison via Supabase Realtime
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

interface DriverAlert {
  id: string;
  order_id: string;
  driver_id: string;
  alert_type: string;
  distance_km: number;
  response_status: 'sent' | 'seen' | 'accepted' | 'ignored';
  sent_at: string;
  seen_at?: string;
  responded_at?: string;
  order_details?: {
    pickup_location: string;
    delivery_location: string;
    estimated_price: number;
    delivery_type: string;
  };
}

export const useDriverOrderNotifications = () => {
  const { user } = useAuth();
  const [pendingAlerts, setPendingAlerts] = useState<DriverAlert[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger les alertes en attente
  const loadPendingAlerts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('delivery_driver_alerts')
        .select('*')
        .eq('driver_id', user.id)
        .in('response_status', ['sent', 'seen'])
        .order('sent_at', { ascending: false });

      if (error) throw error;

      setPendingAlerts(data || []);
    } catch (error) {
      console.error('Error loading pending alerts:', error);
    }
  }, [user]);

  // Marquer une alerte comme vue
  const markAlertAsSeen = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_driver_alerts')
        .update({
          response_status: 'seen',
          seen_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      setPendingAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId
            ? { ...alert, response_status: 'seen', seen_at: new Date().toISOString() }
            : alert
        )
      );
    } catch (error) {
      console.error('Error marking alert as seen:', error);
    }
  }, []);

  // Accepter une commande
  const acceptOrder = useCallback(async (alertId: string, orderId: string) => {
    setLoading(true);
    try {
      // Marquer l'alerte comme acceptée
      const { error: updateError } = await supabase
        .from('delivery_driver_alerts')
        .update({
          response_status: 'accepted',
          responded_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (updateError) throw updateError;

      // Assigner le chauffeur à la commande
      const { error: assignError } = await supabase
        .from('delivery_orders')
        .update({
          driver_id: user?.id,
          status: 'driver_assigned',
          driver_assigned_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .is('driver_id', null); // Seulement si pas déjà assigné

      if (assignError) throw assignError;

      setPendingAlerts(prev => prev.filter(alert => alert.id !== alertId));

      toast.success('Commande acceptée ! 🎉', {
        description: 'Vous pouvez maintenant démarrer la livraison'
      });

      return true;
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Erreur lors de l\'acceptation de la commande');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refuser une commande
  const ignoreOrder = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_driver_alerts')
        .update({
          response_status: 'ignored',
          responded_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      setPendingAlerts(prev => prev.filter(alert => alert.id !== alertId));

      toast.info('Commande ignorée');
    } catch (error) {
      console.error('Error ignoring order:', error);
    }
  }, []);

  // Subscribe aux nouvelles alertes en temps réel
  useEffect(() => {
    if (!user) return;

    loadPendingAlerts();

    const channel = supabase
      .channel('driver-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_driver_alerts',
          filter: `driver_id=eq.${user.id}`
        },
        (payload) => {
          const newAlert = payload.new as DriverAlert;
          
          setPendingAlerts(prev => [newAlert, ...prev]);

          // Afficher une notification toast avec son
          toast.success(`🔔 Nouvelle course ${newAlert.order_details?.delivery_type?.toUpperCase()}`, {
            description: `À ${newAlert.distance_km.toFixed(1)}km - ${newAlert.order_details?.estimated_price} FC`,
            action: {
              label: 'Accepter',
              onClick: () => acceptOrder(newAlert.id, newAlert.order_id)
            },
            duration: 60000 // 1 minute
          });

          // Jouer un son de notification
          try {
            const audio = new Audio('/notification.mp3');
            audio.play();
          } catch (error) {
            console.error('Error playing notification sound:', error);
          }

          // Vibration si supportée
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadPendingAlerts, acceptOrder]);

  return {
    pendingAlerts,
    loading,
    markAlertAsSeen,
    acceptOrder,
    ignoreOrder,
    refreshAlerts: loadPendingAlerts
  };
};
