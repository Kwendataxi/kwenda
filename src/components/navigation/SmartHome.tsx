import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import MobileSplash from '@/pages/MobileSplash';
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
    return <MobileSplash />;
  }

  // NON CONNECTÉ : rediriger vers /app/auth
  if (!user) {
    return <Navigate to="/app/auth" replace />;
  }

  // CONNECTÉ : redirection selon le rôle
  const loginIntent = localStorage.getItem('kwenda_login_intent') as 'restaurant' | 'driver' | 'partner' | 'admin' | 'client' | null;
  const targetRole = loginIntent || userRole || 'client';
  
  console.log('🚀 [SmartHome] Redirection utilisateur connecté:', {
    loginIntent,
    userRole,
    targetRole,
    userId: user.id,
    isMobilePlatform
  });
  
  switch (targetRole) {
    case 'restaurant':
      return <Navigate to="/app/restaurant" replace />;
    case 'driver':
      return <Navigate to="/app/chauffeur" replace />;
    case 'partner':
      return <Navigate to="/app/partenaire" replace />;
    case 'admin':
      return <Navigate to="/app/admin" replace />;
    default:
      return <Navigate to="/app/client" replace />;
  }
};
