/**
 * CONFIGURATION REACT QUERY OPTIMISÉE
 * Cache intelligent, retry automatique, monitoring centralisé
 */

import { QueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache configuration
      staleTime: 5 * 60 * 1000, // 5 minutes (données considérées fraîches)
      gcTime: 10 * 60 * 1000, // 10 minutes (données gardées en cache) - renamed from cacheTime
      
      // Retry configuration
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch configuration
      refetchOnWindowFocus: false, // Désactivé pour réduire les appels
      refetchOnMount: false,
      refetchOnReconnect: 'always', // Refetch quand connexion revient
      
      // Error handling
      throwOnError: false,
    },
    mutations: {
      retry: 2,
      retryDelay: 1000,
      onError: (error) => {
        logger.error('❌ [React Query] Mutation error:', error);
      },
    },
  },
});
