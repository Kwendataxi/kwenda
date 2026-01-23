/**
 * CONFIGURATION REACT QUERY OPTIMISÉE
 * Cache intelligent, retry automatique, monitoring centralisé
 */

import { QueryClient, QueryCache } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache configuration optimisé
      staleTime: 2 * 60 * 1000, // 2 minutes - plus réactif pour données critiques
      gcTime: 10 * 60 * 1000, // 10 minutes (données gardées en cache)
      
      // Retry configuration optimisé
      retry: 2, // Réduit pour réactivité
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 10000),
      
      // Refetch configuration
      refetchOnWindowFocus: false,
      refetchOnMount: 'always', // Toujours vérifier au mount pour fraîcheur
      refetchOnReconnect: 'always',
      
      // Placeholders pour éviter les loading states
      placeholderData: (previousData: unknown) => previousData,
      
      // Error handling
      throwOnError: false,
      
      // Network mode pour offline support
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1, // Réessai minimal pour mutations
      retryDelay: 500,
      onError: (error) => {
        logger.error('❌ [React Query] Mutation error:', error);
      },
      // Optimistic updates par défaut
      networkMode: 'offlineFirst',
    },
  },
  // ✅ PHASE 4 : Monitoring des performances
  queryCache: new QueryCache({
    onSuccess: (data, query) => {
      const duration = Date.now() - (query.state.dataUpdatedAt || Date.now());
      if (duration > 1000) {
        logger.warn(`⏱️ [React Query] Slow query (${duration}ms):`, query.queryKey);
      }
    },
    onError: (error, query) => {
      logger.error('❌ [React Query] Query error:', { 
        queryKey: query.queryKey, 
        error 
      });
    },
  }),
});
