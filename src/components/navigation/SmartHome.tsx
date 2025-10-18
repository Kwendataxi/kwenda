import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import MobileSplash from '@/pages/MobileSplash';
import Index from '@/pages/Index';
import { isMobileApp, isPWA } from '@/services/platformDetection';
import { useUserRole } from '@/hooks/useUserRole';

/**
 * Composant intelligent pour la route "/" qui :
 * - Affiche MobileSplash si mobile/PWA ET pas connecté
 * - Affiche ClientApp si connecté (mobile/PWA)
 * - Affiche Index sinon (web standard)
 */
export const SmartHome = () => {
  const { user, session, loading } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();
  const isMobilePlatform = isMobileApp() || isPWA();

  // Sur mobile/PWA, toujours afficher le splash (il gère la suite)
  if (loading || isMobilePlatform) {
    return <MobileSplash />;
  }

  // Sur web standard et connecté, redirection intelligente selon le rôle
  if (user && session && !isMobilePlatform && !roleLoading) {
    // Stratégie de redirection en cascade :
    // 1. loginIntent (priorité maximale)
    // 2. userRole de la base de données
    // 3. Fallback vers client
    
    const loginIntent = localStorage.getItem('kwenda_login_intent') as 'restaurant' | 'driver' | 'partner' | 'admin' | 'client' | null;
    const targetRole = loginIntent || userRole || 'client';
    
    console.log('🔍 [SmartHome] Redirection logic:', {
      loginIntent,
      userRole,
      targetRole,
      userId: user.id
    });
    
    switch (targetRole) {
      case 'restaurant':
        return <Navigate to="/restaurant" replace />;
      case 'driver':
        return <Navigate to="/chauffeur" replace />;
      case 'partner':
        return <Navigate to="/partenaire" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/client" replace />;
    }
  }

  // Sur web standard et non connecté, afficher Index
  if (!isMobilePlatform) {
    return <Index />;
  }

  // Fallback
  return <MobileSplash />;
};
