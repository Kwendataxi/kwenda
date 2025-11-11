import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sessionReady: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;
    
    const initializeAuth = async () => {
      if (!mounted) return;
      
      setLoading(true);
      
      try {
        logger.info('🔐 Auth Provider initializing...');
        
        // ✅ ÉTAPE 1 : Établir le listener EN PREMIER
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (mounted) {
            logger.info('🔄 Auth state changed', { 
              event: _event, 
              hasSession: !!session, 
              userId: session?.user?.id,
              sessionReady,
              timestamp: new Date().toISOString()
            });
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
          }
        });
        
        authSubscription = subscription;
        
        if (!mounted) {
          authSubscription?.unsubscribe();
          return;
        }
        
        // ✅ ÉTAPE 2 : Attendre que le listener soit prêt
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // ✅ ÉTAPE 3 : Récupérer la session existante
        logger.info('⏳ Loading initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) {
          authSubscription?.unsubscribe();
          return;
        }
        
        if (error) {
          logger.error('❌ Auth session error', error);
        }
        
        logger.info('✅ Initial session loaded', { hasSession: !!session, userId: session?.user?.id });
        setSession(session);
        setUser(session?.user ?? null);
        setSessionReady(true);
        
      } catch (error) {
        logger.error('❌ Auth initialization error', error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setSessionReady(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      authSubscription?.unsubscribe();
    };
  }, []);

  // ✅ Auto-refresh session 5 minutes AVANT expiration
  useEffect(() => {
    if (!session?.expires_at) return;
    
    const expiresAt = session.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 0); // 5 min avant
    
    if (refreshTime > 0) {
      logger.info(`⏰ [AuthProvider] Auto-refresh programmé dans ${Math.round(refreshTime / 1000 / 60)} minutes`);
      
      const refreshTimeout = setTimeout(async () => {
        logger.info('🔄 [AuthProvider] Auto-refresh de la session...');
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          logger.error('❌ [AuthProvider] Erreur auto-refresh:', error);
        } else {
          logger.info('✅ [AuthProvider] Session rafraîchie avec succès');
        }
      }, refreshTime);
      
      return () => clearTimeout(refreshTimeout);
    }
  }, [session]);

  const signOut = async () => {
    // Récupérer le rôle AVANT la déconnexion pour redirection intelligente
    let redirectPath = '/auth'; // Défaut pour clients
    
    try {
      const selectedRole = localStorage.getItem('kwenda_selected_role');
      
    // Mapping rôle → page de connexion
    const roleRedirectMap: Record<string, string> = {
      'driver': '/driver/auth',
      'partner': '/partner/auth',
      'restaurant': '/restaurant/auth',
      'admin': '/operatorx/admin/auth',
      'client': '/auth'
    };
    
    redirectPath = roleRedirectMap[selectedRole as string] || '/auth';
    } catch (error) {
      logger.warn('Unable to determine role for redirect:', error);
    }
    
    // Déconnecter (ignorer les erreurs de session inexistante)
    await supabase.auth.signOut({ scope: 'local' });
    
    // Nettoyer l'état local APRÈS la déconnexion
    setUser(null);
    setSession(null);
    
    // Clear localStorage
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-wddlktajnhwhyquwcdgf-auth-token');
    localStorage.removeItem('kwenda_user_roles_cache');
    localStorage.removeItem('kwenda_selected_role');
    localStorage.removeItem('kwenda_login_intent');
    
    // Redirection intelligente selon le rôle (utiliser setTimeout pour éviter les race conditions)
    setTimeout(() => {
      window.location.href = redirectPath;
    }, 100);
  };

  const value = {
    user,
    session,
    loading,
    sessionReady,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};