import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { TaxiLoadingTransition } from '@/components/loading/TaxiLoadingTransition';
import Index from '@/pages/Index';
import { isMobileApp, isPWA } from '@/services/platformDetection';
import { useUserRole } from '@/hooks/useUserRole';

/**
 * Composant intelligent pour la route "/app" qui :
 * - Redirige vers /app/auth si non connecté
 * - Redirige vers le dashboard approprié si connecté selon le rôle
 */
export const SmartHome = () => {
  const { user, session, loading, sessionReady } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();
  const isMobilePlatform = isMobileApp() || isPWA();

  // Attendre que la session ET les rôles soient chargés
  if (loading || !sessionReady || roleLoading) {
    return <TaxiLoadingTransition />;
  }

  // NON CONNECTÉ : rediriger vers /auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // ✅ CONNECTÉ : Redirection simple selon userRole
  const redirectPath = userRole === 'admin' ? '/app/admin'
    : userRole === 'partner' ? '/app/partenaire'
    : userRole === 'driver' ? '/app/chauffeur'
    : userRole === 'restaurant' ? '/app/restaurant'
    : '/app/client';
  
  console.log('🚀 [SmartHome] Redirecting user', {
    userRole,
    redirectPath,
    userId: user.id
  });
  
  return <Navigate to={redirectPath} replace />;
};
