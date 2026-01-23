import { useEffect } from "react";
import { DriverLogin } from "@/components/auth/DriverLogin";
import { autoUpdateService } from "@/services/AutoUpdateService";

const DriverAuth = () => {
  useEffect(() => {
    // Pause les vérifications de mise à jour pendant l'authentification
    autoUpdateService.pause();
    return () => autoUpdateService.resume();
  }, []);

  return <DriverLogin />;
};

export default DriverAuth;
