import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BrandLogo from "@/components/brand/BrandLogo";
import { APP_CONFIG } from "@/config/appConfig";
import { logger } from "@/utils/logger";
import { supabase } from "@/integrations/supabase/client";

const MobileSplash: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ SKIP INSTANTANÉ si utilisateur déjà connecté
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        logger.info('🔥 User already logged in - fetching role and redirecting');
        
        // ✅ Récupérer le rôle depuis la session
        const { data: roles } = await supabase.rpc('get_user_roles', {
          p_user_id: session.user.id
        });
        
        const primaryRole = roles?.[0]?.role || 'client';
        
        // ✅ Rediriger vers le bon dashboard selon le rôle
        const redirectPath = primaryRole === 'admin' ? '/admin' 
          : primaryRole === 'partner' ? '/partenaire'
          : primaryRole === 'driver' ? '/chauffeur'
          : '/client'; // Client dashboard
        
        logger.info('🚀 Redirecting to dashboard', { primaryRole, redirectPath });
        navigate(redirectPath, { replace: true });
        return true;
      }
      return false;
    };

    checkSession().then((skipped) => {
      if (skipped) return;

      const ctx = localStorage.getItem("last_context") || APP_CONFIG.type || "client";
      const splashShown = localStorage.getItem(`splash_shown::${ctx}`) === "1";
      const onboardingSeen = localStorage.getItem(`onboarding_seen::${ctx}`) === "1";
      
      // ✅ SKIP IMMÉDIAT si déjà vu (pas de setTimeout)
      if (splashShown && onboardingSeen) {
        navigate(APP_CONFIG.authRoute || "/auth", { replace: true });
        return;
      }
      
      // Marquer le splash comme vu
      try {
        localStorage.setItem(`splash_shown::${ctx}`, "1");
      } catch {}
      
      const timer = setTimeout(() => {
        if (!onboardingSeen) {
          navigate(`/onboarding?context=${encodeURIComponent(ctx)}`, { replace: true });
        } else {
          navigate(APP_CONFIG.authRoute || "/auth", { replace: true });
        }
      }, 200); // ⚡ Réduit à 200ms

      // Safety timeout ultra-agressif : 1s max
      const safetyTimer = setTimeout(() => {
        logger.warn('⚠️ Splash safety timeout - forcing /auth');
        navigate(APP_CONFIG.authRoute || "/auth", { replace: true });
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearTimeout(safetyTimer);
      };
    });
  }, [navigate]);

  // Slogan dynamique selon le contexte
  const getSlogan = () => {
    switch (APP_CONFIG.type) {
      case 'driver':
        return 'Gagnez plus, roulez mieux !';
      case 'partner':
        return 'Gérez votre flotte efficacement !';
      default:
        return 'Courses abordables tous les jours !';
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Fond rouge dégradé avec couches multiples */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#DC2626] via-[#EF4444] to-[#F87171]" />
      
      {/* Lueurs dynamiques d'ambiance */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
        style={{ background: 'rgba(255, 255, 255, 0.1)' }}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3] 
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl"
        style={{ background: 'rgba(252, 165, 165, 0.2)' }}
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2] 
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
      />

      {/* Particules avancées avec trajectoires variées */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => {
          const size = Math.random() * 3 + 1;
          const duration = Math.random() * 4 + 3;
          const delay = Math.random() * 3;
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/30"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                filter: 'blur(1px)',
              }}
              animate={{
                x: [0, Math.random() * 100 - 50, 0],
                y: [0, Math.random() * -150 - 50, 0],
                opacity: [0, 0.8, 0],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </div>

      {/* Contenu central */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{
          duration: 0.3,
          ease: [0.34, 1.56, 0.64, 1],
        }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Halo lumineux autour du logo */}
        <div className="relative">
          <motion.div
            className="absolute -inset-8 rounded-full blur-2xl"
            style={{ background: 'rgba(255, 255, 255, 0.2)' }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Logo avec effet de lévitation */}
          <motion.div
            animate={{
              y: [0, -10, 0],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <BrandLogo 
              size={200} 
              className="drop-shadow-2xl relative z-10" 
            />
          </motion.div>
        </div>

        {/* Slogan principal avec effet de lueur */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="mt-8 text-center px-8"
        >
          <h2
            className="text-white text-3xl font-black tracking-tight leading-tight"
            style={{
              textShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 40px rgba(255,255,255,0.2)',
            }}
          >
            {getSlogan()}
          </h2>

          {/* Ligne décorative animée */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-4 mx-auto h-1 w-24 rounded-full"
            style={{
              background: 'linear-gradient(to right, transparent, white, transparent)',
            }}
          />
        </motion.div>

        {/* Loading indicator premium */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          {/* Spinner glassmorphism */}
          <div className="relative">
            <motion.div
              className="w-12 h-12 rounded-full border-4 border-white/30 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full blur-xl animate-pulse" style={{ background: 'rgba(255, 255, 255, 0.2)' }} />
          </div>

          {/* Texte "Chargement" avec animation */}
          <motion.p
            className="text-white/80 text-sm font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Chargement<motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >...</motion.span>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MobileSplash;
