import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';

export const useSessionGuard = () => {
  const { session } = useAuth();
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [lastSessionCheck, setLastSessionCheck] = useState(Date.now());

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      if (!mounted) return;

      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error || !currentSession) {
          logger.error('❌ [SessionGuard] Session invalide:', error);
          setIsSessionValid(false);
          
          // Essayer de rafraîchir automatiquement
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && mounted) {
            logger.info('✅ [SessionGuard] Session rafraîchie avec succès');
            setIsSessionValid(true);
          }
        } else {
          if (mounted) {
            setIsSessionValid(true);
          }
        }
        
        if (mounted) {
          setLastSessionCheck(Date.now());
        }
      } catch (error) {
        logger.error('❌ [SessionGuard] Erreur vérification session:', error);
        if (mounted) {
          setIsSessionValid(false);
        }
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 60000); // Toutes les 60s

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [session]);

  return { isSessionValid, lastSessionCheck };
};
