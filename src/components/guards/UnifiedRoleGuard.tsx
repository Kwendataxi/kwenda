import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/types/roles';

interface UnifiedRoleGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  fallbackAuthPath?: string;
  fallbackDashboardPath?: string;
}

/**
 * 🛡️ GUARD UNIFIÉ POUR TOUS LES RÔLES
 * Vérifie le rôle utilisateur de manière sécurisée via la base de données
 */
export const UnifiedRoleGuard = ({ 
  children, 
  requiredRole,
  fallbackAuthPath,
  fallbackDashboardPath 
}: UnifiedRoleGuardProps) => {
  const { user, sessionReady } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Déterminer les chemins de fallback selon le rôle
  const getAuthPath = (): string => {
    if (fallbackAuthPath) return fallbackAuthPath;
    
    switch (requiredRole) {
      case 'driver':
        return '/driver/auth';
      case 'partner':
        return '/partner/auth';
      case 'admin':
        return '/operatorx/admin/auth';
      case 'restaurant':
        return '/restaurant/auth';
      case 'client':
      default:
        return '/auth';
    }
  };

  const getDashboardPath = (): string => {
    if (fallbackDashboardPath) return fallbackDashboardPath;
    
    switch (requiredRole) {
      case 'driver':
        return '/app/chauffeur';
      case 'partner':
        return '/app/partenaire';
      case 'admin':
        return '/app/admin';
      case 'restaurant':
        return '/app/restaurant';
      case 'client':
      default:
        return '/app/client';
    }
  };

  const checkRole = useCallback(async () => {
    // Attendre que la session soit prête
    if (!sessionReady) {
      console.log(`🔍 [${requiredRole}Guard] En attente de sessionReady...`);
      return;
    }

    console.log(`🔍 [${requiredRole}Guard] Vérification`, {
      hasUser: !!user,
      userId: user?.id,
      sessionReady
    });

    if (!user) {
      console.log(`❌ [${requiredRole}Guard] Pas d'utilisateur, redirection vers ${getAuthPath()}`);
      setLoading(false);
      navigate(getAuthPath(), { replace: true });
      return;
    }

    try {
      // Vérification SÉCURISÉE via database (pas localStorage!)
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', requiredRole)
        .eq('is_active', true)
        .maybeSingle();

      if (roleError || !roleData) {
        console.error(`❌ [${requiredRole}Guard] Rôle manquant:`, roleError);
        setLoading(false);
        navigate(getAuthPath(), { replace: true });
        return;
      }

      console.log(`✅ [${requiredRole}Guard] Rôle confirmé`);
      setHasAccess(true);
      setLoading(false);

    } catch (error) {
      console.error(`❌ [${requiredRole}Guard] Erreur inattendue:`, error);
      setLoading(false);
      navigate(getAuthPath(), { replace: true });
    }
  }, [user, sessionReady, navigate, requiredRole]);

  useEffect(() => {
    checkRole();
  }, [checkRole]);

  // Timeout de sécurité : 10 secondes max
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.error(`❌ [${requiredRole}Guard] Timeout de sécurité (10s)`);
        setLoading(false);
        navigate(getAuthPath(), { replace: true });
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [loading, navigate, requiredRole]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground">Vérification en cours...</span>
      </div>
    );
  }

  return hasAccess ? <>{children}</> : null;
};
