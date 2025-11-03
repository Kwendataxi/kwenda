import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

type AppReadyContextType = {
  sessionReady: boolean;
  userRole: string | null;
  contentReady: boolean;
  user: User | null;
  session: Session | null;
};

const AppReadyContext = createContext<AppReadyContextType | undefined>(undefined);

export const useAppReady = () => {
  const context = useContext(AppReadyContext);
  if (!context) {
    throw new Error('useAppReady must be used within AppReadyProvider');
  }
  return context;
};

interface AppReadyProviderProps {
  children: ReactNode;
  initialSession?: Session | null;
}

/**
 * 🚀 CONTEXTE GLOBAL DE PRÉPARATION APP
 * Centralise les états de session, rôle et contenu
 * Évite les vérifications redondantes
 */
export const AppReadyProvider = ({ children, initialSession }: AppReadyProviderProps) => {
  const [sessionReady, setSessionReady] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [contentReady, setContentReady] = useState(false);
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [session, setSession] = useState<Session | null>(initialSession ?? null);

  // ✅ Timeout de sécurité pour éviter les blocages infinis
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (!sessionReady || !contentReady) {
        console.warn('⚠️ [AppReady] Safety timeout triggered - forcing ready state');
        setSessionReady(true);
        setContentReady(true);
        if (!userRole && user) {
          setUserRole('client'); // Fallback par défaut
        }
      }
    }, 5000); // 5 secondes max

    return () => clearTimeout(safetyTimeout);
  }, [sessionReady, contentReady, userRole, user]);

  // Charger la session et le rôle en parallèle
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Si session déjà fournie, juste charger le rôle
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          setSessionReady(true);

          if (initialSession.user) {
            try {
              const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role');
              
              if (roleError) {
                console.error('❌ [AppReady] RPC Error:', roleError);
                // Fallback sur user_roles
                const { data: fallbackRoles } = await supabase
                  .from('user_roles')
                  .select('role')
                  .eq('user_id', initialSession.user.id)
                  .eq('is_active', true)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();
                
                setUserRole(fallbackRoles?.role || 'client');
              } else {
                setUserRole(roleData || 'client');
              }
            } catch (error) {
              console.error('❌ [AppReady] Error fetching role:', error);
              setUserRole('client'); // Fallback sécurisé
            }
          }
          setContentReady(true);
          return;
        }

        // Sinon charger la session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setSessionReady(true);

        // Charger le rôle si connecté
        if (currentSession?.user) {
          try {
            const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role');
            
            if (roleError) {
              console.error('❌ [AppReady] RPC Error:', roleError);
              const { data: fallbackRoles } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', currentSession.user.id)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
              
              setUserRole(fallbackRoles?.role || 'client');
            } else {
              setUserRole(roleData || 'client');
            }
          } catch (error) {
            console.error('❌ [AppReady] Error fetching role:', error);
            setUserRole('client');
          }
        }

        setContentReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setSessionReady(true);
        setContentReady(true);
      }
    };

    initializeApp();

    // Écouter les changements de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setSessionReady(true);

      if (currentSession?.user) {
        try {
          const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role');
          
          if (roleError) {
            console.error('❌ [AppReady] RPC Error:', roleError);
            const { data: fallbackRoles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', currentSession.user.id)
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            setUserRole(fallbackRoles?.role || 'client');
          } else {
            setUserRole(roleData || 'client');
          }
        } catch (error) {
          console.error('❌ [AppReady] Error fetching role:', error);
          setUserRole('client');
        }
      } else {
        setUserRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialSession]);

  return (
    <AppReadyContext.Provider value={{ sessionReady, userRole, contentReady, user, session }}>
      {children}
    </AppReadyContext.Provider>
  );
};
