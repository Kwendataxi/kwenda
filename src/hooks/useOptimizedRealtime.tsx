/**
 * HOOK REALTIME OPTIMISÉ - PHASE 6
 * Gestion intelligente des channels Realtime avec connection pooling
 * Limite le nombre de connexions simultanées et implémente retry avec backoff
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeConfig {
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
}

interface OptimizedRealtimeOptions extends RealtimeConfig {
  onPayload: (payload: any) => void;
  onError?: (error: Error) => void;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Hook avec retry exponentiel et gestion d'erreurs
 */
export const useOptimizedRealtime = ({
  table,
  filter,
  event = '*',
  schema = 'public',
  onPayload,
  onError,
  maxRetries = 5,
  retryDelay = 1000
}: OptimizedRealtimeOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const subscribe = useCallback(() => {
    // Cleanup précédent
    cleanup();

    const channelName = `${table}:${filter || 'all'}`;
    
    try {
      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: false },
            presence: { key: '' }
          }
        })
        .on(
          'postgres_changes' as any,
          {
            event,
            schema,
            table,
            filter
          } as any,
          (payload: any) => {
            // Reset retry count on successful message
            retryCountRef.current = 0;
            
            // Clear reconnect timeout
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
            
            onPayload(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[Realtime] Subscribed to ${channelName}`);
            retryCountRef.current = 0;
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`[Realtime] Error on ${channelName}`);
            
            // Retry avec backoff exponentiel
            if (retryCountRef.current < maxRetries) {
              const delay = retryDelay * Math.pow(2, retryCountRef.current);
              retryCountRef.current++;
              
              console.log(`[Realtime] Retrying in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
              
              reconnectTimeoutRef.current = setTimeout(() => {
                subscribe();
              }, delay);
            } else {
              const error = new Error(`Max retries (${maxRetries}) reached for ${channelName}`);
              console.error(error);
              onError?.(error);
            }
          } else if (status === 'TIMED_OUT') {
            console.warn(`[Realtime] Timed out on ${channelName}, retrying...`);
            reconnectTimeoutRef.current = setTimeout(() => {
              subscribe();
            }, retryDelay);
          } else if (status === 'CLOSED') {
            console.log(`[Realtime] Channel ${channelName} closed`);
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('[Realtime] Subscribe error:', error);
      onError?.(error as Error);
    }
  }, [table, filter, event, schema, onPayload, onError, maxRetries, retryDelay, cleanup]);

  useEffect(() => {
    subscribe();
    return cleanup;
  }, [subscribe, cleanup]);

  return {
    channel: channelRef.current,
    reconnect: subscribe
  };
};

/**
 * Connection Pool pour limiter les channels simultanés
 */
class RealtimeConnectionPool {
  private maxConnections = 10;
  private pools: Map<string, { channel: RealtimeChannel; lastUsed: number }> = new Map();

  getOrCreateChannel(
    key: string,
    factory: () => RealtimeChannel
  ): RealtimeChannel {
    // Si on a déjà ce channel, le réutiliser
    if (this.pools.has(key)) {
      const pool = this.pools.get(key)!;
      pool.lastUsed = Date.now();
      return pool.channel;
    }

    // Si on a atteint la limite, fermer le moins utilisé
    if (this.pools.size >= this.maxConnections) {
      const leastUsed = Array.from(this.pools.entries())
        .sort((a, b) => a[1].lastUsed - b[1].lastUsed)[0];
      
      if (leastUsed) {
        console.log(`[Realtime Pool] Closing least used channel: ${leastUsed[0]}`);
        supabase.removeChannel(leastUsed[1].channel);
        this.pools.delete(leastUsed[0]);
      }
    }

    // Créer nouveau channel
    const channel = factory();
    this.pools.set(key, {
      channel,
      lastUsed: Date.now()
    });

    return channel;
  }

  cleanup(maxAge: number = 5 * 60 * 1000) {
    const now = Date.now();
    
    for (const [key, pool] of this.pools.entries()) {
      if (now - pool.lastUsed > maxAge) {
        console.log(`[Realtime Pool] Cleaning up old channel: ${key}`);
        supabase.removeChannel(pool.channel);
        this.pools.delete(key);
      }
    }
  }

  getStats() {
    return {
      activeConnections: this.pools.size,
      maxConnections: this.maxConnections,
      channels: Array.from(this.pools.keys())
    };
  }
}

export const realtimePool = new RealtimeConnectionPool();

// Cleanup automatique toutes les 2 minutes
setInterval(() => {
  realtimePool.cleanup();
}, 2 * 60 * 1000);

/**
 * Hook avec connection pooling
 */
export const usePooledRealtime = (options: OptimizedRealtimeOptions) => {
  const channelKey = `${options.table}:${options.filter || 'all'}`;
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    channelRef.current = realtimePool.getOrCreateChannel(
      channelKey,
      () => {
        return supabase
          .channel(channelKey)
          .on(
            'postgres_changes' as any,
            {
              event: options.event || '*',
              schema: options.schema || 'public',
              table: options.table,
              filter: options.filter
            } as any,
            options.onPayload
          )
          .subscribe();
      }
    );

    // Ne pas cleanup ici car le pool gère le lifecycle
    return () => {
      // Le pool garde le channel actif pour réutilisation
    };
  }, [channelKey, options]);

  return channelRef.current;
};
