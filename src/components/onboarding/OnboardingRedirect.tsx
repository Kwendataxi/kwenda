import React, { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Props { children: ReactNode }

export const OnboardingRedirect: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const lastCtx = (localStorage.getItem("last_context") || "client").toLowerCase();
    const seen = localStorage.getItem(`onboarding_seen::${lastCtx}`) === "1";
    if (!seen) {
      navigate(`/onboarding?context=${encodeURIComponent(lastCtx)}`, { replace: true });
    }
  }, [navigate]);

  return <>{children}</>;
};
