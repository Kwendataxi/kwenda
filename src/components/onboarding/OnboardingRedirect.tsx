import React, { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isMobileApp, isPWA } from "@/services/platformDetection";

interface Props { children: ReactNode }

export const OnboardingRedirect: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Ne pas rediriger si on est déjà sur l'onboarding ou le splash
    if (location.pathname === "/onboarding" || location.pathname === "/splash") {
      return;
    }

    const lastCtx = (localStorage.getItem("last_context") || "client").toLowerCase();
    const seen = localStorage.getItem(`onboarding_seen::${lastCtx}`) === "1";
    
    // Pour mobile apps et PWA, forcer l'onboarding au premier lancement
    if ((isMobileApp() || isPWA()) && !seen) {
      navigate(`/onboarding?context=${encodeURIComponent(lastCtx)}`, { replace: true });
    }
  }, [navigate, location.pathname]);

  return <>{children}</>;
};
