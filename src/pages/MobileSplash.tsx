import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useAnimationControls } from "framer-motion";
import { MapPin } from "lucide-react";
import kwendaLogo from "@/assets/kwenda-logo.png";
import { APP_CONFIG } from "@/config/appConfig";
import { logger } from "@/utils/logger";
import { supabase } from "@/integrations/supabase/client";

const MobileSplash: React.FC = () => {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const logoControls = useAnimationControls();

  useEffect(() => {
    // Animation séquentielle du logo
    logoControls.start({
      scale: [0.8, 1.05, 1],
      opacity: [0, 1, 1],
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    });

    const ctx = localStorage.getItem("last_context") || "client";
    const exitTimer = setTimeout(() => setIsExiting(true), 2500);
    
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const loginIntent = localStorage.getItem('kwenda_login_intent') as 'restaurant' | 'driver' | 'partner' | 'admin' | 'client' | null;
        
        if (loginIntent) {
          const redirectPath = loginIntent === 'admin' ? '/operatorx/admin' 
            : loginIntent === 'partner' ? '/partenaire'
            : loginIntent === 'driver' ? '/chauffeur'
            : loginIntent === 'restaurant' ? '/restaurant'
            : '/client';
          
          logger.info('🎯 [MobileSplash] Redirecting via loginIntent', { loginIntent, redirectPath });
          navigate(redirectPath, { replace: true });
          return;
        }
        
        const { data: roles } = await supabase.rpc('get_user_roles', {
          p_user_id: session.user.id
        });
        const primaryRole = roles?.[0]?.role || 'client';
        const redirectPath = primaryRole === 'admin' ? '/operatorx/admin' 
          : primaryRole === 'partner' ? '/partenaire'
          : primaryRole === 'driver' ? '/chauffeur'
          : primaryRole === 'restaurant' ? '/restaurant'
          : '/client';
        
        logger.info('🚀 [MobileSplash] Redirecting via get_user_roles', { primaryRole, redirectPath });
        navigate(redirectPath, { replace: true });
      } else {
        // Vérifier les deux clés (contextuelle ET générique)
        const onboardingSeenContextual = localStorage.getItem(`onboarding_seen::${ctx}`) === "1";
        const onboardingSeenGeneric = localStorage.getItem("onboarding_seen") === "1";
        const onboardingSeen = onboardingSeenContextual || onboardingSeenGeneric;
        
        if (!onboardingSeen) {
          logger.info('🎓 Not logged in - redirecting to onboarding');
          navigate(`/onboarding?context=${encodeURIComponent(ctx)}`, { replace: true });
        } else {
          logger.info('🔐 Not logged in - redirecting to auth');
          navigate(APP_CONFIG.authRoute || "/auth", { replace: true });
        }
      }
    }, 3000);

    const safetyTimer = setTimeout(() => {
      logger.warn('⚠️ Splash safety timeout');
      navigate(APP_CONFIG.authRoute || "/auth", { replace: true });
    }, 4000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, [navigate, logoControls]);

  // Slogan dynamique selon l'intent de login
  const getSlogan = () => {
    const loginIntent = localStorage.getItem('kwenda_login_intent');
    
    switch (loginIntent) {
      case 'restaurant':
        return 'Livraison express pour vos clients !';
      case 'driver':
        return 'Gagnez plus, roulez mieux !';
      case 'partner':
        return 'Gérez votre flotte efficacement !';
      default:
        return 'Transport • Livraison • Marketplace';
    }
  };

  return (
    <motion.div 
      className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)'
      }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
    >
      {/* Cercles de géolocalisation subtils */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute border border-white/10 rounded-full"
            initial={{ width: 0, height: 0, opacity: 0 }}
            animate={{
              width: [0, 500],
              height: [0, 500],
              opacity: [0, 0.15, 0],
            }}
            transition={{
              duration: 4,
              delay: i * 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Particules minimalistes */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[
          { angle: 45, radius: 200, delay: 0 },
          { angle: 225, radius: 200, delay: 1.5 },
        ].map(({ angle, radius, delay }, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute"
            initial={{ 
              x: Math.cos((angle * Math.PI) / 180) * radius,
              y: Math.sin((angle * Math.PI) / 180) * radius,
              opacity: 0,
            }}
            animate={{
              x: Math.cos(((angle + 360) * Math.PI) / 180) * radius,
              y: Math.sin(((angle + 360) * Math.PI) / 180) * radius,
              opacity: [0, 0.3, 0.3, 0],
            }}
            transition={{
              duration: 10,
              delay: delay,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <MapPin className="w-6 h-6 text-white/40" />
          </motion.div>
        ))}
      </div>

      {/* Contenu central */}
      <motion.div
        animate={logoControls}
        className="relative z-10 flex flex-col items-center gap-8"
      >
        {/* Logo avec halo doux */}
        <div className="relative">
          {/* Halo subtil */}
          <motion.div
            className="absolute -inset-16 rounded-full blur-3xl"
            style={{ background: 'rgba(255, 255, 255, 0.08)' }}
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
          />

          {/* Logo */}
          <motion.img
            src={kwendaLogo}
            alt="Kwenda Logo"
            className="relative z-10 w-48 h-48 object-contain drop-shadow-2xl"
            animate={{ 
              scale: [0.95, 1, 0.95],
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
          />
        </div>

        {/* Slogan */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center px-8"
        >
          <motion.h2
            className="text-white text-xl font-light tracking-wider"
            style={{ 
              textShadow: '0 2px 10px rgba(0,0,0,0.2)' 
            }}
          >
            {getSlogan()}
          </motion.h2>
          
          {/* Barre de progression douce */}
          <motion.div
            className="mt-8 h-0.5 bg-white/15 rounded-full overflow-hidden mx-auto"
            style={{ width: '160px' }}
          >
            <motion.div
              className="h-full bg-white/60 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: 2.5,
                ease: "easeOut",
              }}
            />
          </motion.div>
        </motion.div>

        {/* Indicateur de chargement minimaliste */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-1.5"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`dot-${i}`}
              className="w-1.5 h-1.5 rounded-full bg-white/50"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.2,
                delay: i * 0.15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default MobileSplash;
