import { useAppReady } from '@/contexts/AppReadyContext';
import { InvisibleLoadingBar } from '@/components/loading/InvisibleLoadingBar';
import { Navigate } from 'react-router-dom';
import Index from '@/pages/Index';
import { isMobileApp, isPWA } from '@/services/platformDetection';

/**
 * 🏠 PUBLIC HOME - Route intelligente pour "/"
 * - Web : Affiche la landing page pour les visiteurs
 * - Mobile (Capacitor/PWA) : Redirige vers /app directement
 * - Utilisateurs connectés : Redirige vers leur espace
 */
export const PublicHome = () => {
  const { user, sessionReady, userRole, contentReady } = useAppReady();

  // 📱 MOBILE APP / PWA : Pas de landing, directement vers l'app
  if (isMobileApp() || isPWA()) {
    console.log('📱 [PublicHome] Mobile/PWA detected, redirecting to /app');
    return <Navigate to="/app" replace />;
  }

  // Attendre que la session soit prête
  if (!sessionReady || !contentReady) {
    return <InvisibleLoadingBar />;
  }

  // NON CONNECTÉ : Landing page (Web uniquement)
  if (!user) {
    return <Index />;
  }

  // CONNECTÉ : Redirection vers l'espace utilisateur
  const redirectPath = userRole === 'admin' ? '/operatorx/admin'
    : userRole === 'partner' ? '/app/partenaire'
    : userRole === 'driver' ? '/app/chauffeur'
    : userRole === 'restaurant' ? '/app/restaurant'
    : '/app/client';

  console.log('🏠 [PublicHome] Redirecting authenticated user from /', {
    userRole,
    redirectPath,
    userId: user.id
  });

  return <Navigate to={redirectPath} replace />;
};
