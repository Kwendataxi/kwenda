import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BrandLogo from "@/components/brand/BrandLogo";
import { APP_CONFIG } from "@/config/appConfig";
import { logger } from "@/utils/logger";

const MobileSplash: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Déterminer la prochaine destination
    const ctx = localStorage.getItem("last_context") || APP_CONFIG.type || "client";
    const onboardingSeen = localStorage.getItem(`onboarding_seen::${ctx}`) === "1";
    
    const timer = setTimeout(() => {
      if (!onboardingSeen) {
        // Rediriger vers onboarding si jamais vu
        navigate(`/onboarding?context=${encodeURIComponent(ctx)}`, { replace: true });
      } else {
        // Sinon aller vers la route d'auth ou route par défaut
        navigate(APP_CONFIG.authRoute || "/auth", { replace: true });
      }
    }, 1500); // ⚡ Réduit de 2000ms à 1500ms

    // ✅ NOUVEAU : Timeout de sécurité à 5 secondes
    const safetyTimer = setTimeout(() => {
      logger.warn('⚠️ Splash timeout exceeded, forcing navigation to /auth');
      navigate(APP_CONFIG.authRoute || "/auth", { replace: true });
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, [navigate]);

  // Couleurs selon le contexte
  const getGradient = () => {
    switch (APP_CONFIG.type) {
      case 'client':
        return 'from-[#DC2626] to-[#EF4444]';
      case 'driver':
        return 'from-[#F59E0B] to-[#FBBF24]';
      case 'partner':
        return 'from-[#10B981] to-[#34D399]';
      default:
        return 'from-[#1B365D] to-[#2563EB]';
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getGradient()} flex items-center justify-center relative overflow-hidden`}>
      {/* Particules d'arrière-plan */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Logo central avec animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.5,
          ease: "easeOut"
        }}
        className="relative z-10"
      >
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <BrandLogo 
            size={180} 
            className="drop-shadow-2xl" 
          />
        </motion.div>

        {/* Texte sous le logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <h1 className="text-white text-2xl font-bold drop-shadow-lg">
            {APP_CONFIG.name}
          </h1>
          <p className="text-white/80 text-sm mt-2">
            Chargement...
          </p>
        </motion.div>

        {/* Loading spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex justify-center"
        >
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MobileSplash;
