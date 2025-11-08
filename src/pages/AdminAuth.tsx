import { useEffect } from "react";
import { AdminLogin } from "@/components/auth/AdminLogin";
import { autoUpdateService } from "@/services/AutoUpdateService";

const AdminAuth = () => {
  useEffect(() => {
    // Pause les vérifications de mise à jour pendant l'authentification
    autoUpdateService.pause();
    return () => autoUpdateService.resume();
  }, []);

  return <AdminLogin />;
};

export default AdminAuth;