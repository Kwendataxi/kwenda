/**
 * ✅ PHASE 3: HOOK REALTIME UNIFIÉ
 * Multiplex tous les événements Realtime en UN SEUL channel
 * Optimisation: 5 channels → 1 channel
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface RealtimeEvent {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
}

type EventCallback = (event: RealtimeEvent) => void;

export const useUnifiedRealtime = () => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [subscribers, setSubscribers] = useState<Map<string, EventCallback>>(new Map());

  // Lazy subscription basée sur visibilité de l'onglet
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsActive(!document.hidden);
    };

    setIsActive(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Abonnement unifié aux événements
  useEffect(() => {
    if (!user || !isActive || subscribers.size === 0) return;

    const channel = supabase
      .channel('unified-realtime-channel')
      // Lottery wins
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'lottery_wins',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        subscribers.forEach(callback => {
          callback({
            table: 'lottery_wins',
            eventType: 'INSERT',
            payload: payload.new
          });
        });
      })
      // Order notifications
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'order_notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        subscribers.forEach(callback => {
          callback({
            table: 'order_notifications',
            eventType: 'INSERT',
            payload: payload.new
          });
        });
      })
      // Transport bookings
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transport_bookings',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        subscribers.forEach(callback => {
          callback({
            table: 'transport_bookings',
            eventType: payload.eventType as any,
            payload: payload.new || payload.old
          });
        });
      })
      // Delivery orders
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'delivery_orders',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        subscribers.forEach(callback => {
          callback({
            table: 'delivery_orders',
            eventType: payload.eventType as any,
            payload: payload.new || payload.old
          });
        });
      })
      // Marketplace orders
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketplace_orders',
        filter: `buyer_id=eq.${user.id}`
      }, (payload) => {
        subscribers.forEach(callback => {
          callback({
            table: 'marketplace_orders',
            eventType: payload.eventType as any,
            payload: payload.new || payload.old
          });
        });
      })
      .subscribe();

    console.log('✅ [UnifiedRealtime] Channel unifié actif');

    return () => {
      supabase.removeChannel(channel);
      console.log('🔌 [UnifiedRealtime] Channel déconnecté');
    };
  }, [user, isActive, subscribers.size]);

  // Fonction pour s'abonner aux événements
  const subscribe = useCallback((id: string, callback: EventCallback) => {
    setSubscribers(prev => new Map(prev).set(id, callback));
    
    return () => {
      setSubscribers(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    };
  }, []);

  return {
    subscribe,
    isActive
  };
};
