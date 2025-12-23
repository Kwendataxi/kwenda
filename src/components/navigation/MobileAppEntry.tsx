/**
 * 📱 MOBILE APP ENTRY POINT
 * Point d'entrée pour les apps natives (Capacitor)
 * Bypass la landing page marketing pour une expérience pro
 */
import { Navigate } from "react-router-dom";
import { useAppReady } from "@/contexts/AppReadyContext";
import MobileSplash from "@/pages/MobileSplash";
import { APP_CONFIG } from "@/config/appConfig";

export const MobileAppEntry = () => {
  const { user, userRole, sessionReady, contentReady } = useAppReady();
  
  // Afficher le splash pendant le chargement
  if (!sessionReady || !contentReady) {
    return <MobileSplash />;
  }
  
  // Non connecté → Page d'authentification directe
  if (!user) {
    // Vérifier si l'onboarding a été vu
    const ctx = APP_CONFIG.type || "client";
    const onboardingSeen = localStorage.getItem(`onboarding_seen::${ctx}`) === "1";
    
    if (!onboardingSeen) {
      return <Navigate to={`/onboarding?context=${encodeURIComponent(ctx)}`} replace />;
    }
    
    return <Navigate to={APP_CONFIG.authRoute || "/auth"} replace />;
  }
  
  // Connecté → Redirection vers le dashboard selon le rôle
  const getRedirectPath = (): string => {
    switch (userRole) {
      case 'admin':
        return '/operatorx/admin';
      case 'partner':
        return '/partenaire';
      case 'driver':
        return '/chauffeur';
      case 'restaurant':
        return '/restaurant';
      case 'client':
      default:
        return '/client';
    }
  };
  
  return <Navigate to={getRedirectPath()} replace />;
};

export default MobileAppEntry;
