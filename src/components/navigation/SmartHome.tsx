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
  const { user, session, loading, sessionReady } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();
  const isMobilePlatform = isMobileApp() || isPWA();

  // Attendre que la session ET les rôles soient chargés
  if (loading || !sessionReady || roleLoading) {
    return <MobileSplash />;
  }

  // Sur mobile/PWA ET PAS CONNECTÉ, afficher splash
  if (!user && isMobilePlatform) {
    return <MobileSplash />;
  }

  // UTILISATEUR CONNECTÉ sur mobile/PWA : redirection directe sans splash
  if (user && session && isMobilePlatform) {
    const loginIntent = localStorage.getItem('kwenda_login_intent') as 'restaurant' | 'driver' | 'partner' | 'admin' | 'client' | null;
    const targetRole = loginIntent || userRole || 'client';
    
    console.log('📱 [SmartHome] Mobile redirection:', {
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

  // Sur web standard et connecté, redirection intelligente selon le rôle
  if (user && session && !isMobilePlatform) {
    const loginIntent = localStorage.getItem('kwenda_login_intent') as 'restaurant' | 'driver' | 'partner' | 'admin' | 'client' | null;
    const targetRole = loginIntent || userRole || 'client';
    
    console.log('💻 [SmartHome] Desktop web redirection:', {
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
