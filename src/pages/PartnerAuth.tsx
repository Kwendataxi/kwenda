import { useEffect } from "react";
import { motion } from 'framer-motion';
import { PartnerLogin } from "@/components/auth/PartnerLogin";
import { autoUpdateService } from "@/services/AutoUpdateService";

const PartnerAuth = () => {
  useEffect(() => {
    // Pause les vérifications de mise à jour pendant l'authentification
    autoUpdateService.pause();
    return () => autoUpdateService.resume();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen"
    >
      <PartnerLogin />
    </motion.div>
  );
};

export default PartnerAuth;
