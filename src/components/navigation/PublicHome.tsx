import { useAppReady } from '@/contexts/AppReadyContext';
import { InvisibleLoadingBar } from '@/components/loading/InvisibleLoadingBar';
import { Navigate } from 'react-router-dom';
import Index from '@/pages/Index';

/**
 * 🏠 PUBLIC HOME - Route intelligente pour "/"
 * Affiche la landing page pour les visiteurs
 * Redirige les utilisateurs connectés vers leur espace
 */
export const PublicHome = () => {
  const { user, sessionReady, userRole, contentReady } = useAppReady();

  // Attendre que la session soit prête
  if (!sessionReady || !contentReady) {
    return <InvisibleLoadingBar />;
  }

  // NON CONNECTÉ : Landing page
  if (!user) {
    return <Index />;
  }

  // CONNECTÉ : Redirection vers l'espace utilisateur
  const redirectPath = userRole === 'admin' ? '/app/admin'
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
