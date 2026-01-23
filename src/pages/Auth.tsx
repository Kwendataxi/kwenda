import { useEffect } from "react";
import { UnifiedAuthPage } from "@/components/auth/UnifiedAuthPage";
import { autoUpdateService } from "@/services/AutoUpdateService";

const Auth = () => {
  useEffect(() => {
    // Pause les vérifications de mise à jour pendant l'authentification
    autoUpdateService.pause();
    return () => autoUpdateService.resume();
  }, []);

  return <UnifiedAuthPage />;
};

export default Auth;