import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SplashScreen } from "@capacitor/splash-screen";
import { DynamicSplash } from "./DynamicSplash";
import { getStartupContext } from "@/services/startupContext";

export const StartupExperience: React.FC = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const ctx = getStartupContext(location.pathname);
    try {
      localStorage.setItem("last_context", ctx);
    } catch {}

    const timer = setTimeout(() => setVisible(false), 1200);

    // Ensure native splash is hidden (safe even if already autohidden)
    SplashScreen.hide().catch(() => {});

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!visible) return null;
  return <DynamicSplash />;
};

export default StartupExperience;
