import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BrandLogo from "@/components/brand/BrandLogo";
import { APP_CONFIG } from "@/config/appConfig";
import { logger } from "@/utils/logger";
import { supabase } from "@/integrations/supabase/client";

const MobileSplash: React.FC = () => {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const ctx = localStorage.getItem("last_context") || APP_CONFIG.type || "client";
    
    // ✅ TOUJOURS afficher le splash pendant 3s (animation complète)
    const exitTimer = setTimeout(() => setIsExiting(true), 2500); // Démarrer fade-out 500ms avant
    
    const timer = setTimeout(async () => {
      // Vérifier la session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // ✅ PRIORITÉ 1 : Vérifier loginIntent AVANT get_user_roles
        const loginIntent = localStorage.getItem('kwenda_login_intent') as 'restaurant' | 'driver' | 'partner' | 'admin' | 'client' | null;
        
        if (loginIntent) {
          // Rediriger directement via loginIntent
          const redirectPath = loginIntent === 'admin' ? '/admin' 
            : loginIntent === 'partner' ? '/partenaire'
            : loginIntent === 'driver' ? '/chauffeur'
            : loginIntent === 'restaurant' ? '/restaurant'
            : '/client';
          
          logger.info('🎯 [MobileSplash] Redirecting via loginIntent', { loginIntent, redirectPath });
          navigate(redirectPath, { replace: true });
          return;
        }
        
        // ✅ PRIORITÉ 2 : Fallback sur get_user_roles
        const { data: roles } = await supabase.rpc('get_user_roles', {
          p_user_id: session.user.id
        });
        const primaryRole = roles?.[0]?.role || 'client';
        const redirectPath = primaryRole === 'admin' ? '/admin' 
          : primaryRole === 'partner' ? '/partenaire'
          : primaryRole === 'driver' ? '/chauffeur'
          : primaryRole === 'restaurant' ? '/restaurant'
          : '/client';
        
        logger.info('🚀 [MobileSplash] Redirecting via get_user_roles', { primaryRole, redirectPath });
        navigate(redirectPath, { replace: true });
      } else {
        // Pas connecté → onboarding puis auth
        const onboardingSeen = localStorage.getItem(`onboarding_seen::${ctx}`) === "1";
        if (!onboardingSeen) {
          logger.info('🎓 Not logged in - redirecting to onboarding');
          navigate(`/onboarding?context=${encodeURIComponent(ctx)}`, { replace: true });
        } else {
          logger.info('🔐 Not logged in - redirecting to auth');
          navigate(APP_CONFIG.authRoute || "/auth", { replace: true });
        }
      }
    }, 3000); // ⚡ 3s pour voir toute l'animation

    // Safety timeout
    const safetyTimer = setTimeout(() => {
      logger.warn('⚠️ Splash safety timeout');
      navigate(APP_CONFIG.authRoute || "/auth", { replace: true });
    }, 4000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
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
    <motion.div 
      className="min-h-screen relative overflow-hidden flex items-center justify-center"
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
    >
      {/* Fond rouge dégradé animé - Phase 1 */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          background: [
            'linear-gradient(135deg, #DC2626 0%, #DC2626 100%)', // Rouge vif pur (0s)
            'linear-gradient(135deg, #EF4444 0%, #F87171 100%)', // Éclaircissement progressif (0.8s)
          ]
        }}
        transition={{
          duration: 0.8,
          ease: [0.43, 0.13, 0.23, 0.96],
        }}
      />

      {/* Contenu central - Phase 2 : Logo Zoom-In */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          delay: 0.3,
          duration: 0.9,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative">
          <BrandLogo 
            size={200} 
            className="drop-shadow-2xl relative z-10" 
          />
          
          {/* Phase 3 : Balayage lumineux horizontal */}
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
              width: '150%',
              height: '100%',
              left: '-25%',
            }}
            initial={{ x: '-150%' }}
            animate={{ x: '150%' }}
            transition={{
              delay: 1.0,
              duration: 0.5,
              ease: 'easeInOut',
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MobileSplash;
