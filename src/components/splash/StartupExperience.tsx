import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!visible) return null;
  return <DynamicSplash />;
};

export default StartupExperience;
