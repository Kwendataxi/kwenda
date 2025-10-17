import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { DynamicSplash } from "./DynamicSplash";
import { getStartupContext } from "@/services/startupContext";

export const StartupExperience: React.FC = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // ✅ NE PAS afficher le splash sur les pages d'auth
    if (location.pathname.includes('/auth') || location.pathname === '/splash') {
      setVisible(false);
      return;
    }

    const ctx = getStartupContext(location.pathname);
    try {
      localStorage.setItem("last_context", ctx);
    } catch {}

    const timer = setTimeout(() => setVisible(false), 600); // ⚡ Réduit à 600ms

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!visible) return null;
  return <DynamicSplash />;
};

export default StartupExperience;
