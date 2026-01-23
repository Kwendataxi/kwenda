import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DispatchProgress {
  driversFound: number;
  currentRadius: number;
  attempt: number;
  status: 'searching' | 'analyzing' | 'selecting' | 'found' | 'error';
}

export const useRideDispatchProgress = (bookingId: string | null) => {
  const [progress, setProgress] = useState<DispatchProgress>({
    driversFound: 0,
    currentRadius: 5,
    attempt: 1,
    status: 'searching'
  });

  useEffect(() => {
    if (!bookingId) return;

    console.log(`🔔 [DispatchProgress] Écoute des notifications pour booking ${bookingId}`);

    // Subscribe to real-time notifications for this booking
    const channel = supabase
      .channel(`dispatch-progress-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_notifications',
          filter: `metadata->>bookingId=eq.${bookingId}`
        },
        (payload) => {
          console.log('📨 [DispatchProgress] Notification reçue:', payload);
          
          const notification = payload.new;
          const metadata = notification.metadata || {};
          
          // Extraire les données réelles de la recherche
          const driversFound = metadata.driversFound || 0;
          const searchRadius = metadata.searchRadius || 5;
          const attempt = metadata.attempt || 1;
          
          console.log(`🔍 [DispatchProgress] ${driversFound} chauffeurs à ${searchRadius}km (tentative ${attempt})`);
          
          // Déterminer le statut basé sur le type de notification
          let status: DispatchProgress['status'] = 'searching';
          
          if (notification.notification_type === 'driver_assigned') {
            status = 'found';
          } else if (notification.notification_type === 'no_driver_available') {
            status = 'error';
          } else if (driversFound > 0) {
            status = 'selecting';
          } else if (metadata.searchRadius > 5) {
            status = 'analyzing';
          }
          
          setProgress({
            driversFound,
            currentRadius: searchRadius,
            attempt,
            status
          });
        }
      )
      .subscribe();

    return () => {
      console.log(`🔕 [DispatchProgress] Arrêt écoute pour ${bookingId}`);
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  return progress;
};
