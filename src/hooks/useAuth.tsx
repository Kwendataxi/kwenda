import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
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

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      if (!mounted) return;
      
      setLoading(true);
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
      if (error) {
        logger.error('Auth session error', error);
      }
        
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        logger.error('Auth initialization error', error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Écouter les changements d'état d'auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Récupérer le rôle AVANT la déconnexion pour redirection intelligente
    let redirectPath = '/auth'; // Défaut pour clients
    
    try {
      const selectedRole = localStorage.getItem('kwenda_selected_role');
      
      // Mapping rôle → page de connexion
      const roleRedirectMap: Record<string, string> = {
        'driver': '/driver/auth',
        'partner': '/partner/auth',
        'admin': '/admin/auth',
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
    
    // Redirection intelligente selon le rôle (utiliser setTimeout pour éviter les race conditions)
    setTimeout(() => {
      window.location.href = redirectPath;
    }, 100);
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};