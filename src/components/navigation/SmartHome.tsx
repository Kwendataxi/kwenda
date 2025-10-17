import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import MobileSplash from '@/pages/MobileSplash';
import Index from '@/pages/Index';
import { isMobileApp, isPWA } from '@/services/platformDetection';

/**
 * Composant intelligent pour la route "/" qui :
 * - Affiche MobileSplash si mobile/PWA ET pas connecté
 * - Affiche ClientApp si connecté (mobile/PWA)
 * - Affiche Index sinon (web standard)
 */
export const SmartHome = () => {
  const { user, session, loading } = useAuth();
  const isMobilePlatform = isMobileApp() || isPWA();

  // Sur mobile/PWA, toujours afficher le splash (il gère la suite)
  if (loading || isMobilePlatform) {
    return <MobileSplash />;
  }

  // Sur web standard et connecté, rediriger vers client
  if (user && session && !isMobilePlatform) {
    return <Navigate to="/client" replace />;
  }

  // Sur web standard et non connecté, afficher Index
  if (!isMobilePlatform) {
    return <Index />;
  }

  // Fallback
  return <MobileSplash />;
};
