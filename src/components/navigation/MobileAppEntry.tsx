/**
 * 📱 MOBILE APP ENTRY POINT - SUPER APP
 * Point d'entrée unifié pour l'application Kwenda
 * Gère l'authentification et la redirection selon le rôle
 */
import { Navigate } from "react-router-dom";
import { useAppReady } from "@/contexts/AppReadyContext";
import MobileSplash from "@/pages/MobileSplash";
import { APP_CONFIG, getRoleRoute, UserRole } from "@/config/appConfig";

export const MobileAppEntry = () => {
  const { user, userRole, sessionReady, contentReady } = useAppReady();
  
  // Afficher le splash pendant le chargement
  if (!sessionReady || !contentReady) {
    return <MobileSplash />;
  }
  
  // Non connecté → Vérifier onboarding puis auth
  if (!user) {
    // Vérifier la clé avec contexte ET la clé générique (fallback)
    const ctx = localStorage.getItem("last_context") || "client";
    const onboardingSeenContextual = localStorage.getItem(`onboarding_seen::${ctx}`) === "1";
    const onboardingSeenGeneric = localStorage.getItem("onboarding_seen") === "1";
    const onboardingSeen = onboardingSeenContextual || onboardingSeenGeneric;
    
    if (!onboardingSeen) {
      return <Navigate to="/onboarding" replace />;
    }
    
    return <Navigate to={APP_CONFIG.authRoute} replace />;
  }
  
  // Connecté → Redirection vers le dashboard selon le rôle
  const redirectPath = getRoleRoute(userRole as UserRole);
  
  return <Navigate to={redirectPath} replace />;
};

export default MobileAppEntry;
