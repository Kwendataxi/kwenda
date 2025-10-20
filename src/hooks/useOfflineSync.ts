/**
 * Hook pour gérer la synchronisation offline
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  syncPendingQueue, 
  getPendingCount, 
  cleanOldPendingItems,
  initOfflineDB 
} from '@/db/offlineQueue';
import { useToast } from '@/hooks/use-toast';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  // Initialiser IndexedDB au montage
  useEffect(() => {
    initOfflineDB().catch(console.error);
  }, []);

  // Mettre à jour le compteur d'éléments en attente
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Erreur comptage pending items:', error);
    }
  }, []);

  // Synchroniser la queue
  const sync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: 0 });

    try {
      const result = await syncPendingQueue((current, total) => {
        setSyncProgress({ current, total });
      });

      if (result.success > 0) {
        toast({
          title: '✅ Synchronisation réussie',
          description: `${result.success} opération(s) synchronisée(s)`,
        });
      }

      if (result.failed > 0) {
        toast({
          title: '⚠️ Synchronisation partielle',
          description: `${result.failed} opération(s) échouée(s)`,
          variant: 'destructive'
        });
      }

      await updatePendingCount();
    } catch (error) {
      console.error('Erreur sync:', error);
      toast({
        title: '❌ Erreur de synchronisation',
        description: 'Impossible de synchroniser les données',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  }, [isSyncing, toast, updatePendingCount]);

  // Nettoyer les vieux éléments
  const cleanup = useCallback(async () => {
    try {
      const deleted = await cleanOldPendingItems();
      if (deleted > 0) {
        console.log(`🗑️ ${deleted} éléments obsolètes supprimés`);
        await updatePendingCount();
      }
    } catch (error) {
      console.error('Erreur cleanup:', error);
    }
  }, [updatePendingCount]);

  // Écouter les changements de connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: '🌐 Connexion rétablie',
        description: 'Synchronisation en cours...',
      });
      sync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: '📡 Mode hors-ligne',
        description: 'Vos actions seront synchronisées au retour de la connexion',
        variant: 'default'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sync, toast]);

  // Mettre à jour le compteur au montage et périodiquement
  useEffect(() => {
    updatePendingCount();
    
    const interval = setInterval(() => {
      updatePendingCount();
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, [updatePendingCount]);

  // Cleanup quotidien
  useEffect(() => {
    const dailyCleanup = setInterval(() => {
      cleanup();
    }, 24 * 60 * 60 * 1000); // Toutes les 24h

    return () => clearInterval(dailyCleanup);
  }, [cleanup]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncProgress,
    sync,
    cleanup
  };
};
