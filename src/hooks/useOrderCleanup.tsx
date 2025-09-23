import { useEffect } from 'react';
import { cleanupOldPendingOrders } from '@/utils/orderCleanup';

export const useOrderCleanup = () => {
  useEffect(() => {
    // Nettoyer les anciennes commandes au chargement de l'app
    const performCleanup = async () => {
      await cleanupOldPendingOrders();
    };

    performCleanup();

    // Nettoyer périodiquement toutes les 10 minutes
    const cleanupInterval = setInterval(performCleanup, 10 * 60 * 1000);

    return () => clearInterval(cleanupInterval);
  }, []);
};