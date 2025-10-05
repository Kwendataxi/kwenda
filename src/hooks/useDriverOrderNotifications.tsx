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
  response_status: 'sent' | 'seen' | 'accepted' | 'ignored' | 'expired';
  sent_at: string;
  seen_at?: string | null;
  responded_at?: string | null;
  expires_at?: string | null;
  order_details?: {
    pickup_location: string;
    delivery_location: string;
    estimated_price: number;
    delivery_type: string;
  } | null;
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
        .in('alert_type', ['new_delivery_request', 'marketplace_delivery'])
        .order('sent_at', { ascending: false });

      if (error) throw error;

      setPendingAlerts((data || []) as unknown as DriverAlert[]);
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
            ? { ...alert, response_status: 'seen' as const, seen_at: new Date().toISOString() }
            : alert
        )
      );
    } catch (error) {
      console.error('Error marking alert as seen:', error);
    }
  }, []);

  // PHASE 2: Accepter avec protection atomique et versioning
  const acceptOrder = useCallback(async (alertId: string, orderId: string) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return false;
    }

    setLoading(true);
    try {
      // Détecter si c'est une commande marketplace
      const alertData = pendingAlerts.find(a => a.id === alertId);
      const isMarketplace = alertData?.alert_type === 'marketplace_delivery';
      
      if (isMarketplace) {
        // Assigner dans marketplace_delivery_assignments
        const { error: assignError } = await supabase
          .from('marketplace_delivery_assignments')
          .update({ 
            driver_id: user.id, 
            assignment_status: 'accepted' 
          })
          .eq('order_id', orderId)
          .is('driver_id', null);
        
        if (assignError) {
          console.error('Error accepting marketplace order:', assignError);
          toast.error('Erreur lors de l\'acceptation de la commande');
          return false;
        }
        
        // Mettre à jour la commande marketplace
        await supabase
          .from('marketplace_orders')
          .update({ status: 'in_preparation' })
          .eq('id', orderId);
        
        // Marquer l'alerte comme acceptée
        await supabase
          .from('delivery_driver_alerts')
          .update({ 
            response_status: 'accepted',
            responded_at: new Date().toISOString()
          })
          .eq('id', alertId);
        
        setPendingAlerts(prev => prev.filter(alert => alert.id !== alertId));
        toast.success('✅ Course marketplace acceptée !');
        return true;
      }
      
      // Logique delivery_orders existante
      // 1. Vérifier l'état actuel de la commande
      const { data: currentOrder, error: checkError } = await supabase
        .from('delivery_orders')
        .select('id, driver_id, assignment_version, status')
        .eq('id', orderId)
        .single();

      if (checkError) {
        console.error('Error checking order:', checkError);
        throw new Error('Impossible de vérifier la commande');
      }

      // 2. Si déjà assignée, refuser immédiatement
      if (currentOrder.driver_id) {
        await supabase.rpc('log_assignment_conflict', {
          p_order_type: 'delivery_order',
          p_order_id: orderId,
          p_driver_id: user.id,
          p_conflict_reason: 'Course déjà assignée à un autre chauffeur'
        });

        await supabase
          .from('delivery_driver_alerts')
          .update({ 
            response_status: 'ignored',
            responded_at: new Date().toISOString()
          })
          .eq('id', alertId);

        setPendingAlerts(prev => prev.filter(alert => alert.id !== alertId));
        toast.error('⚠️ Course déjà prise par un autre chauffeur');
        return false;
      }

      // 3. Tentative d'assignation atomique avec versioning
      const { data: updateResult, error: orderError } = await supabase
        .from('delivery_orders')
        .update({ 
          driver_id: user.id,
          status: 'driver_assigned',
          driver_assigned_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('assignment_version', currentOrder.assignment_version)
        .is('driver_id', null)
        .select();

      // 4. Vérifier si l'update a réussi
      if (!updateResult || updateResult.length === 0) {
        await supabase.rpc('log_assignment_conflict', {
          p_order_type: 'delivery_order',
          p_order_id: orderId,
          p_driver_id: user.id,
          p_conflict_reason: 'Conflit de version (race condition)'
        });

        await supabase
          .from('delivery_driver_alerts')
          .update({ 
            response_status: 'ignored',
            responded_at: new Date().toISOString()
          })
          .eq('id', alertId);

        setPendingAlerts(prev => prev.filter(alert => alert.id !== alertId));
        toast.error('⚠️ Un autre chauffeur a accepté en même temps');
        return false;
      }

      if (orderError) throw orderError;

      // 5. Marquer cette alerte comme acceptée
      const { error: alertError } = await supabase
        .from('delivery_driver_alerts')
        .update({ 
          response_status: 'accepted',
          responded_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (alertError) throw alertError;

      // 6. Annuler toutes les autres alertes pour cette même commande
      await supabase
        .from('delivery_driver_alerts')
        .update({ 
          response_status: 'ignored',
          responded_at: new Date().toISOString()
        })
        .eq('order_id', orderId)
        .neq('id', alertId)
        .eq('response_status', 'sent');

      // 7. Logger le succès
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        activity_type: 'order_accepted',
        description: 'Course de livraison acceptée avec succès',
        reference_type: 'delivery_order',
        reference_id: orderId
      });

      setPendingAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      toast.success('✅ Course acceptée !', {
        description: 'Vous pouvez maintenant démarrer la livraison'
      });

      return true;
    } catch (error: any) {
      console.error('Error accepting order:', error);
      toast.error('❌ Erreur: ' + (error.message || 'Erreur inconnue'));
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
          const newAlert = payload.new as any;
          
          setPendingAlerts(prev => [newAlert as DriverAlert, ...prev]);

          // Afficher une notification toast avec son
          toast.success(`🔔 Nouvelle course ${newAlert.order_details?.delivery_type?.toUpperCase() || ''}`, {
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
            audio.play().catch(() => {});
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
