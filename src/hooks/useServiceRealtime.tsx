import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useServiceRealtime = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    // S'abonner aux changements de service_configurations
    const channel = supabase
      .channel('service-configurations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_configurations'
        },
        (payload) => {
          console.log('🔄 Service configuration changed:', payload);

          // Invalider le cache pour recharger les services
          queryClient.invalidateQueries({ queryKey: ['service-configurations'] });

          // Notifier l'utilisateur si un service a été désactivé
          if (payload.eventType === 'UPDATE' && payload.new && !payload.new.is_active) {
            const serviceName = payload.new.display_name || payload.new.service_type;
            toast({
              title: "⚠️ Service désactivé",
              description: `Le service "${serviceName}" a été temporairement désactivé.`,
              variant: "destructive",
            });
          }

          // Notifier si un service a été activé
          if (payload.eventType === 'UPDATE' && payload.new && payload.new.is_active && payload.old && !payload.old.is_active) {
            const serviceName = payload.new.display_name || payload.new.service_type;
            toast({
              title: "✅ Service activé",
              description: `Le service "${serviceName}" est maintenant disponible !`,
            });
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  return null;
};
