import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface AuthResult {
  success: boolean;
  error?: string;
  roles?: any[];
  user?: any;
}

/**
 * Hook centralisé pour l'authentification avec retry automatique
 * Gère la stabilisation de session et la vérification des rôles
 */
export const useAuthWithRetry = () => {
  /**
   * Connexion avec retry automatique et vérification des rôles
   */
  const loginWithRetry = async (
    email: string,
    password: string,
    requiredRole?: 'client' | 'driver' | 'partner' | 'restaurant' | 'admin'
  ): Promise<AuthResult> => {
    try {
      logger.info('🔐 Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        logger.error('❌ Login error', error);
        return { success: false, error: error.message };
      }

      logger.info('✅ Login successful', { userId: data.user?.id });

      // ✅ Attendre stabilisation session (augmenté à 1.5s)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // ✅ Forcer refresh session + attendre confirmation
      let { data: { session: refreshedSession }, error: sessionError } = await supabase.auth.getSession();
      
      // ✅ Retry si session non établie après 1.5s
      if (!refreshedSession) {
        logger.warn('⚠️ Session non établie après 1.5s, retry...');
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryResult = await supabase.auth.getSession();
        refreshedSession = retryResult.data.session;
        sessionError = retryResult.error;
      }
      
      if (sessionError || !refreshedSession) {
        logger.error('❌ Session non établie après connexion', sessionError);
        return { success: false, error: 'Session non établie. Veuillez réessayer.' };
      }
      
      logger.info('📦 Session refreshed', { 
        hasSession: !!refreshedSession,
        expiresAt: refreshedSession.expires_at,
        userId: data.user?.id
      });

      const user = data.user;

      if (user) {
        // ✅ Vérifier rôle avec retry si échec
        let roles;
        let retries = 3;
        
        while (retries > 0) {
          const { data: rolesData, error: rolesError } = await supabase.rpc('get_user_roles', {
            p_user_id: user.id
          });

          if (!rolesError && rolesData) {
            roles = rolesData;
            logger.info('✅ Roles verified:', {
              roles: roles.map((r: any) => r.role)
            });
            break;
          }
          
          if (rolesError?.message?.includes('JWT') || rolesError?.message?.includes('session')) {
            retries--;
            await new Promise(resolve => setTimeout(resolve, 500));
            logger.warn(`⚠️ Retry get_user_roles (${3 - retries}/3)`);
            continue;
          }
          
          return { success: false, error: 'Erreur lors de la vérification du rôle' };
        }

        if (!roles || roles.length === 0) {
          return { success: false, error: 'Aucun rôle trouvé pour ce compte' };
        }

        // Vérifier le rôle requis si spécifié
        if (requiredRole) {
          const hasRequiredRole = roles.some((r: any) => r.role === requiredRole);

          if (!hasRequiredRole) {
            await supabase.auth.signOut();
            
            const otherRole = roles[0]?.role;
            let suggestion = '';
            
            if (otherRole === 'client') {
              suggestion = " Connectez-vous via l'espace client.";
            } else if (otherRole === 'driver') {
              suggestion = " Connectez-vous via l'espace chauffeur.";
            } else if (otherRole === 'partner') {
              suggestion = " Connectez-vous via l'espace partenaire.";
            } else if (otherRole === 'restaurant') {
              suggestion = " Connectez-vous via l'espace restaurant.";
            } else if (otherRole === 'admin') {
              suggestion = " Connectez-vous via l'espace admin.";
            }
            
            return { 
              success: false, 
              error: `Ce compte n'est pas un compte ${requiredRole}.${suggestion}`
            };
          }
        }

        return { success: true, roles, user };
      }

      return { success: false, error: 'Utilisateur non trouvé' };
    } catch (error: any) {
      logger.error("Login error", error);
      return { success: false, error: error.message || "Erreur lors de la connexion" };
    }
  };

  return { loginWithRetry };
};
