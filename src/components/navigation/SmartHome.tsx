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

  // Si en chargement sur mobile/PWA, afficher splash
  if (loading && isMobilePlatform) {
    return <MobileSplash />;
  }

  // Si mobile/PWA et pas connecté, afficher splash
  if (isMobilePlatform && !user && !session) {
    return <MobileSplash />;
  }

  // Si connecté sur mobile/PWA, rediriger vers le dashboard client
  if (user && session && isMobilePlatform) {
    return <Navigate to="/client" replace />;
  }

  // Si web standard, afficher Index
  if (!isMobilePlatform) {
    return <Index />;
  }

  // Fallback : splash
  return <MobileSplash />;
};
